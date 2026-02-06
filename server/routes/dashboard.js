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
      // Get last day of current month (works for all months including Feb)
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthEnd = lastDay.toISOString().split('T')[0];

      // Get KPI targets from settings
      const hostLiveKpi = await getKpiTarget(3);
      const contentCreatorKpi = await getKpiTarget(4);
      const warehouseKpi = await getKpiTarget(2);

      // Host Live stats - separate queries to avoid JOIN multiplication
      let hostLiveStats = { total_hosts: 0, total_target: 0, total_current: 0 };
      try {
        const hostCount = await db.get(`
          SELECT COUNT(*) as total_hosts, COALESCE(SUM(monthly_target_hours), 0) as total_target
          FROM hosts WHERE active = 1
        `);
        const sessionHours = await db.get(`
          SELECT COALESCE(SUM(ls.duration_hours), 0) as total_current
          FROM live_sessions ls
          JOIN hosts h ON ls.host_id = h.id
          WHERE h.active = 1 AND ls.date >= ? AND ls.date <= ?
        `, [monthStart, monthEnd]);
        hostLiveStats = {
          total_hosts: parseInt(hostCount?.total_hosts) || 0,
          total_target: parseFloat(hostCount?.total_target) || 0,
          total_current: parseFloat(sessionHours?.total_current) || 0
        };
      } catch (e) { console.error('Dashboard hostLive error:', e.message); }

      const hostLiveTarget = hostLiveKpi.target_hours || hostLiveStats.total_target || 100;

      // Content Creator stats
      let contentCreatorStats = { total_creators: 0, total_posts: 0 };
      try {
        const ccCount = await db.get(`SELECT COUNT(*) as total_creators FROM content_creators WHERE active = 1`);
        const cpCount = await db.get(`
          SELECT COUNT(*) as total_posts FROM content_posts
          WHERE date >= ? AND date <= ?
        `, [monthStart, monthEnd]);
        contentCreatorStats = {
          total_creators: parseInt(ccCount?.total_creators) || 0,
          total_posts: parseInt(cpCount?.total_posts) || 0
        };
      } catch (e) { console.error('Dashboard contentCreator error:', e.message); }
      const contentCreatorTarget = contentCreatorKpi.target_posts || 30;

      // Warehouse stats
      let warehouseStats = { total_checklists: 0, completed: 0 };
      try {
        const ws = await db.get(`
          SELECT 
            COUNT(*) as total_checklists,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed
          FROM warehouse_checklists
          WHERE date = ?
        `, [today]);
        warehouseStats = {
          total_checklists: parseInt(ws?.total_checklists) || 0,
          completed: parseInt(ws?.completed) || 0
        };
      } catch (e) { console.error('Dashboard warehouse error:', e.message); }

      // Warehouse wrong orders stats
      let wrongOrderStats = { total: 0, pending: 0, resolved: 0 };
      try {
        const wo = await db.get(`
          SELECT 
            COUNT(*) as total,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
            COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved
          FROM warehouse_wrong_orders
          WHERE date >= ? AND date <= ?
        `, [monthStart, monthEnd]);
        wrongOrderStats = {
          total: parseInt(wo?.total) || 0,
          pending: parseInt(wo?.pending) || 0,
          resolved: parseInt(wo?.resolved) || 0
        };
      } catch (e) { console.error('Dashboard wrongOrders error:', e.message); }
      
      const warehouseWrongOrderTarget = warehouseKpi.max_wrong_orders || 5;

      // Crewstore stats
      let crewstoreOpening = null;
      let crewstoreClosing = null;
      try { crewstoreOpening = await db.get('SELECT * FROM crewstore_opening WHERE date = ?', [today]); } catch (e) {}
      try { crewstoreClosing = await db.get('SELECT * FROM crewstore_closing WHERE date = ?', [today]); } catch (e) {}
      
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
      const crewstoreKpi = await getKpiTarget(1);
      
      let crewstoreMonthlyStats = { total_days: 0, opening_count: 0, total_sales: 0 };
      let crewstoreCompletionStats = { opening_days: 0, closing_days: 0 };
      let onTimeOpenings = 0;
      let activeDates = [];

      try {
        const cms = await db.get(`
          SELECT 
            COUNT(*) as total_days,
            COALESCE(SUM(daily_sales), 0) as total_sales
          FROM crewstore_closing
          WHERE date >= ? AND date <= ?
        `, [monthStart, monthEnd]);
        crewstoreMonthlyStats = {
          total_days: parseInt(cms?.total_days) || 0,
          total_sales: parseInt(cms?.total_sales) || 0
        };
      } catch (e) { console.error('Dashboard crewstore monthly error:', e.message); }

      try {
        const ccs = await db.get(`
          SELECT 
            COUNT(DISTINCT co.date) as opening_days,
            COUNT(DISTINCT cc.date) as closing_days
          FROM crewstore_opening co
          LEFT JOIN crewstore_closing cc ON co.date = cc.date
          WHERE co.date >= ? AND co.date <= ?
        `, [monthStart, monthEnd]);
        crewstoreCompletionStats = {
          opening_days: parseInt(ccs?.opening_days) || 0,
          closing_days: parseInt(ccs?.closing_days) || 0
        };
      } catch (e) { console.error('Dashboard crewstore completion error:', e.message); }

      try {
        const otResult = await db.get(`
          SELECT COUNT(*) as count
          FROM crewstore_opening
          WHERE date >= ? AND date <= ? AND open_time <= '10:00'
        `, [monthStart, monthEnd]);
        onTimeOpenings = parseInt(otResult?.count) || 0;
      } catch (e) { console.error('Dashboard ontime error:', e.message); }

      try {
        activeDates = await db.all(`
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
      } catch (e) { console.error('Dashboard calendar error:', e.message); activeDates = []; }

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
