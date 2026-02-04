import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get all creators with their current month progress
  router.get('/creators', (req, res) => {
    try {
      const creators = db.prepare(`
        SELECT cc.*, s.name, s.photo_url,
               COALESCE(COUNT(cp.id), 0) as current_month_posts
        FROM content_creators cc
        JOIN staff s ON cc.staff_id = s.id
        LEFT JOIN content_posts cp ON cc.id = cp.creator_id 
          AND strftime('%Y-%m', cp.date) = strftime('%Y-%m', 'now')
        WHERE cc.active = 1
        GROUP BY cc.id
        ORDER BY current_month_posts DESC
      `).all();
      
      res.json(creators);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get creator by ID
  router.get('/creators/:id', (req, res) => {
    try {
      const creator = db.prepare(`
        SELECT cc.*, s.name, s.photo_url
        FROM content_creators cc
        JOIN staff s ON cc.staff_id = s.id
        WHERE cc.id = ?
      `).get(req.params.id);

      if (!creator) {
        return res.status(404).json({ error: 'Creator not found' });
      }

      // Get posts for current month
      const posts = db.prepare(`
        SELECT * FROM content_posts 
        WHERE creator_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        ORDER BY date DESC
      `).all(req.params.id);

      res.json({ ...creator, posts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create creator
  router.post('/creators', (req, res) => {
    try {
      const { staff_id, monthly_target_posts, platforms } = req.body;
      
      // Check if creator already exists for this staff
      const existing = db.prepare('SELECT id FROM content_creators WHERE staff_id = ?').get(staff_id);
      
      if (existing) {
        db.prepare('UPDATE content_creators SET monthly_target_posts = ?, platforms = ?, active = 1 WHERE id = ?')
          .run(monthly_target_posts, platforms, existing.id);
        res.json({ id: existing.id, staff_id, monthly_target_posts, platforms });
      } else {
        const result = db.prepare('INSERT INTO content_creators (staff_id, monthly_target_posts, platforms) VALUES (?, ?, ?)')
          .run(staff_id, monthly_target_posts, platforms);
        res.json({ id: result.lastInsertRowid, staff_id, monthly_target_posts, platforms });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update creator
  router.put('/creators/:id', (req, res) => {
    try {
      const { monthly_target_posts, platforms } = req.body;
      db.prepare('UPDATE content_creators SET monthly_target_posts = ?, platforms = ? WHERE id = ?')
        .run(monthly_target_posts, platforms, req.params.id);
      res.json({ message: 'Creator updated successfully! ✨' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete creator
  router.delete('/creators/:id', (req, res) => {
    try {
      // Delete all posts for this creator first
      db.prepare('DELETE FROM content_posts WHERE creator_id = ?').run(req.params.id);
      // Then delete the creator
      db.prepare('DELETE FROM content_creators WHERE id = ?').run(req.params.id);
      res.json({ message: 'Creator deleted successfully!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all posts
  router.get('/posts', (req, res) => {
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

      const posts = db.prepare(query).all(...params);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add post
  router.post('/posts', (req, res) => {
    try {
      const { creator_id, date, content_type, platform, title, url, views, likes, comments, shares } = req.body;

      const result = db.prepare(`
        INSERT INTO content_posts (creator_id, date, content_type, platform, title, url, views, likes, comments, shares, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(creator_id, date, content_type, platform, title, url, views || 0, likes || 0, comments || 0, shares || 0, req.user?.id || 1);

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
  router.put('/posts/:id', (req, res) => {
    try {
      const { date, content_type, platform, title, url, views, likes, comments, shares } = req.body;
      db.prepare(`
        UPDATE content_posts 
        SET date = ?, content_type = ?, platform = ?, title = ?, url = ?, views = ?, likes = ?, comments = ?, shares = ?
        WHERE id = ?
      `).run(date, content_type, platform, title, url, views || 0, likes || 0, comments || 0, shares || 0, req.params.id);
      res.json({ message: 'Post updated successfully!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete post
  router.delete('/posts/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM content_posts WHERE id = ?').run(req.params.id);
      res.json({ message: 'Post deleted successfully!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
