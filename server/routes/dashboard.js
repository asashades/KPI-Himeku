import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get KPI target from settings
  const getKpiTarget = async (departmentId) => {
    try {
      const setting = await db.get('SELECT kpi_config FROM department_kpi_settings WHERE department_id = ?', [departmentId]);
      if (setting?.kpi_config) {
        return typeof setting.kpi_config === 'string' ? JSON.parse(setting.kpi_config) : setting.kpi_config;
      }
    } catch (e) {}
    return {};
  };

  // Get dashboard overview
  router.get('/overview', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthStart = currentMonth + '-01';
      const monthEnd = currentMonth + '-31';

      // Get KPI targets from settings
      const hostLiveKpi = await getKpiTarget(3); // Host Live = dept 3
      const contentCreatorKpi = await getKpiTarget(4); // Content Creator = dept 4
      const warehouseKpi = await getKpiTarget(2); // Warehouse = dept 2

      // Host Live stats (PostgreSQL compatible)
      const hostLiveStats = await db.get(`
        SELECT 
          COUNT(DISTINCT h.id) as total_hosts,
          COALESCE(SUM(h.monthly_target_hours), 0) as total_target,
          COALESCE(SUM(ls.duration_hours), 0) as total_current
        FROM hosts h
        LEFT JOIN live_sessions ls ON h.id = ls.host_id 
          AND ls.date >= ? AND ls.date <= ?
        WHERE h.active = 1
      `, [monthStart, monthEnd]);

      // Use KPI setting target if available, else use sum of individual targets
      const hostLiveTarget = hostLiveKpi.target_hours || hostLiveStats.total_target || 100;

      // Content Creator stats
      let contentCreatorStats = { total_creators: 0, total_posts: 0 };
      try {
        const ccStats = await db.get(`
          SELECT 
            COUNT(DISTINCT cc.id) as total_creators,
            COUNT(cp.id) as total_posts
          FROM content_creators cc
          LEFT JOIN content_posts cp ON cc.id = cp.creator_id 
            AND cp.created_at >= ? AND cp.created_at <= ?
          WHERE cc.active = 1
        `, [monthStart, monthEnd + ' 23:59:59']);
        contentCreatorStats = ccStats || contentCreatorStats;
      } catch (e) {
        // Table might not exist
      }
      const contentCreatorTarget = contentCreatorKpi.target_posts || 30;

      // Warehouse stats
      const warehouseStats = await db.get(`
        SELECT 
          COUNT(*) as total_checklists,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM warehouse_checklists
        WHERE date = ?
      `, [today]);

      // Warehouse wrong orders stats
      let wrongOrderStats = { total: 0, pending: 0, resolved: 0 };
      try {
        wrongOrderStats = await db.get(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
          FROM warehouse_wrong_orders
          WHERE date >= ? AND date <= ?
        `, [monthStart, monthEnd]) || wrongOrderStats;
      } catch (e) {}
      
      const warehouseWrongOrderTarget = warehouseKpi.max_wrong_orders || 5; // Max acceptable wrong orders

      // Crewstore stats
      const crewstoreOpening = await db.get('SELECT * FROM crewstore_opening WHERE date = ?', [today]);
      const crewstoreClosing = await db.get('SELECT * FROM crewstore_closing WHERE date = ?', [today]);
      
      // Calculate opening and closing progress
      let openingProgress = 0;
      let closingProgress = 0;
      
      if (crewstoreOpening) {
        const openingItems = JSON.parse(crewstoreOpening.items || '[]');
        if (openingItems.length > 0) {
          const checkedItems = openingItems.filter(item => item.checked).length;
          openingProgress = (checkedItems / openingItems.length) * 100;
        }
      }
      
      if (crewstoreClosing) {
        const closingItems = JSON.parse(crewstoreClosing.items || '[]');
        if (closingItems.length > 0) {
          const checkedItems = closingItems.filter(item => item.checked).length;
          closingProgress = (checkedItems / closingItems.length) * 100;
        }
      }
      
      // Crewstore KPI
      const crewstoreKpi = await getKpiTarget(1); // Crew Store = dept 1
      
      // Calculate crewstore monthly stats
      const crewstoreMonthlyStats = await db.get(`
        SELECT 
          COUNT(*) as total_days,
          SUM(CASE WHEN id IS NOT NULL THEN 1 ELSE 0 END) as opening_count,
          COALESCE(SUM(daily_sales), 0) as total_sales
        FROM crewstore_closing
        WHERE date >= ? AND date <= ?
      `, [monthStart, monthEnd]) || { total_days: 0, opening_count: 0, total_sales: 0 };

      // Count days with both opening and closing
      const crewstoreCompletionStats = await db.get(`
        SELECT 
          COUNT(DISTINCT co.date) as opening_days,
          COUNT(DISTINCT cc.date) as closing_days
        FROM crewstore_opening co
        LEFT JOIN crewstore_closing cc ON co.date = cc.date
        WHERE co.date >= ? AND co.date <= ?
      `, [monthStart, monthEnd]) || { opening_days: 0, closing_days: 0 };

      // On-time opening check (before 10:00 AM considered on-time)
      const onTimeOpeningsResult = await db.get(`
        SELECT COUNT(*) as count
        FROM crewstore_opening
        WHERE date >= ? AND date <= ? AND open_time <= '10:00'
      `, [monthStart, monthEnd]);
      const onTimeOpenings = onTimeOpeningsResult?.count || 0;

      // Calendar data - dates with any activity
      const activeDates = await db.all(`
        SELECT DISTINCT date FROM (
          SELECT date FROM live_sessions WHERE date >= ? AND date <= ?
          UNION
          SELECT date FROM warehouse_checklists WHERE date >= ? AND date <= ?
          UNION
          SELECT date FROM crewstore_opening WHERE date >= ? AND date <= ?
          UNION
          SELECT date FROM crewstore_closing WHERE date >= ? AND date <= ?
        ) AS combined_dates
        ORDER BY date
      `, [monthStart, monthEnd, monthStart, monthEnd, monthStart, monthEnd, monthStart, monthEnd]);

      res.json({
        hostLive: {
          totalHosts: hostLiveStats.total_hosts,
          targetHours: hostLiveTarget,
          currentHours: hostLiveStats.total_current,
          progress: hostLiveTarget > 0 
            ? (hostLiveStats.total_current / hostLiveTarget) * 100 
            : 0
        },
        contentCreator: {
          totalCreators: contentCreatorStats.total_creators || 0,
          totalPosts: contentCreatorStats.total_posts || 0,
          targetPosts: contentCreatorTarget,
          progress: contentCreatorTarget > 0
            ? (contentCreatorStats.total_posts / contentCreatorTarget) * 100
            : 0
        },
        warehouse: {
          totalChecklists: warehouseStats.total_checklists,
          completedChecklists: warehouseStats.completed || 0,
          progress: warehouseStats.total_checklists > 0
            ? (warehouseStats.completed / warehouseStats.total_checklists) * 100
            : 0,
          wrongOrders: {
            total: wrongOrderStats.total || 0,
            pending: wrongOrderStats.pending || 0,
            resolved: wrongOrderStats.resolved || 0,
            target: warehouseWrongOrderTarget
          }
        },
        crewstore: {
          openingCompleted: !!crewstoreOpening,
          closingCompleted: !!crewstoreClosing,
          openingProgress: openingProgress,
          closingProgress: closingProgress,
          todaySales: crewstoreClosing?.daily_sales || 0,
          monthlySales: crewstoreMonthlyStats.total_sales || 0,
          targetSales: crewstoreKpi.target_sales || 0,
          openingDays: crewstoreCompletionStats.opening_days || 0,
          closingDays: crewstoreCompletionStats.closing_days || 0,
          onTimeOpenings: onTimeOpenings,
          tapStatus: crewstoreOpening?.tap_status || null,
          tapNotes: crewstoreOpening?.tap_notes || null
        },
        calendar: {
          activeDates: activeDates.map(d => d.date)
        },
        date: today
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
