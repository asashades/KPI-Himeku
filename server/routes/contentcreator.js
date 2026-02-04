import express from 'express';

// Helper function to get month date range
function getMonthRange() {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthEnd = lastDay.toISOString().split('T')[0];
  return { monthStart, monthEnd };
}

export default function (db) {
  const router = express.Router();

  // Get all creators with their current month progress
  router.get('/creators', async (req, res) => {
    try {
      const { monthStart, monthEnd } = getMonthRange();
      
      const creators = await db.all(`
        SELECT cc.*, s.name, s.photo_url,
               COALESCE(COUNT(cp.id), 0) as current_month_posts
        FROM content_creators cc
        JOIN staff s ON cc.staff_id = s.id
        LEFT JOIN content_posts cp ON cc.id = cp.creator_id 
          AND cp.date >= ? AND cp.date <= ?
        WHERE cc.active = 1
        GROUP BY cc.id, s.name, s.photo_url
        ORDER BY current_month_posts DESC
      `, [monthStart, monthEnd]);
      
      res.json(creators);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get creator by ID
  router.get('/creators/:id', async (req, res) => {
    try {
      const creator = await db.get(`
        SELECT cc.*, s.name, s.photo_url
        FROM content_creators cc
        JOIN staff s ON cc.staff_id = s.id
        WHERE cc.id = ?
      `, [req.params.id]);

      if (!creator) {
        return res.status(404).json({ error: 'Creator not found' });
      }

      // Get posts for current month
      const { monthStart, monthEnd } = getMonthRange();
      const posts = await db.all(`
        SELECT * FROM content_posts 
        WHERE creator_id = ? AND date >= ? AND date <= ?
        ORDER BY date DESC
      `, [req.params.id, monthStart, monthEnd]);

      res.json({ ...creator, posts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create creator
  router.post('/creators', async (req, res) => {
    try {
      const { staff_id, monthly_target_posts, platforms } = req.body;
      
      // Check if creator already exists for this staff
      const existing = await db.get('SELECT id FROM content_creators WHERE staff_id = ?', [staff_id]);
      
      if (existing) {
        await db.run('UPDATE content_creators SET monthly_target_posts = ?, platforms = ?, active = 1 WHERE id = ?', [monthly_target_posts, platforms, existing.id]);
        res.json({ id: existing.id, staff_id, monthly_target_posts, platforms });
      } else {
        const result = await db.run('INSERT INTO content_creators (staff_id, monthly_target_posts, platforms) VALUES (?, ?, ?)', [staff_id, monthly_target_posts, platforms]);
        res.json({ id: result.lastInsertRowid, staff_id, monthly_target_posts, platforms });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update creator
  router.put('/creators/:id', async (req, res) => {
    try {
      const { monthly_target_posts, platforms } = req.body;
      await db.run('UPDATE content_creators SET monthly_target_posts = ?, platforms = ? WHERE id = ?', [monthly_target_posts, platforms, req.params.id]);
      res.json({ message: 'Creator updated successfully! ✨' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete creator
  router.delete('/creators/:id', async (req, res) => {
    try {
      // Delete all posts for this creator first
      await db.run('DELETE FROM content_posts WHERE creator_id = ?', [req.params.id]);
      // Then delete the creator
      await db.run('DELETE FROM content_creators WHERE id = ?', [req.params.id]);
      res.json({ message: 'Creator deleted successfully!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all posts
  router.get('/posts', async (req, res) => {
    try {
      const { start_date, end_date, creator_id } = req.query;
      let query = `
        SELECT cp.*, s.name as creator_name 
        FROM content_posts cp 
        JOIN content_creators cc ON cp.creator_id = cc.id
        JOIN staff s ON cc.staff_id = s.id
        WHERE 1=1
      `;
      const params = [];

      if (start_date) {
        query += ' AND cp.date >= ?';
        params.push(start_date);
      }
      if (end_date) {
        query += ' AND cp.date <= ?';
        params.push(end_date);
      }
      if (creator_id) {
        query += ' AND cp.creator_id = ?';
        params.push(creator_id);
      }

      query += ' ORDER BY cp.date DESC, cp.created_at DESC LIMIT 200';

      const posts = await db.all(query, params);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add post
  router.post('/posts', async (req, res) => {
    try {
      const { creator_id, date, content_type, platform, title, url, views, likes, comments, shares } = req.body;

      const result = await db.run(`
        INSERT INTO content_posts (creator_id, date, content_type, platform, title, url, views, likes, comments, shares, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [creator_id, date, content_type, platform, title, url, views || 0, likes || 0, comments || 0, shares || 0, req.user?.id || 1]);

      res.json({ 
        id: result.lastInsertRowid, 
        creator_id, 
        date, 
        content_type,
        platform,
        title,
        url,
        views,
        likes,
        comments,
        shares
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update post
  router.put('/posts/:id', async (req, res) => {
    try {
      const { date, content_type, platform, title, url, views, likes, comments, shares } = req.body;
      await db.run(`
        UPDATE content_posts 
        SET date = ?, content_type = ?, platform = ?, title = ?, url = ?, views = ?, likes = ?, comments = ?, shares = ?
        WHERE id = ?
      `, [date, content_type, platform, title, url, views || 0, likes || 0, comments || 0, shares || 0, req.params.id]);
      res.json({ message: 'Post updated successfully!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete post
  router.delete('/posts/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM content_posts WHERE id = ?', [req.params.id]);
      res.json({ message: 'Post deleted successfully!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
