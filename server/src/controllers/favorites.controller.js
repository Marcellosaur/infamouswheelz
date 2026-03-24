const db = require("../config/db");

// GET /api/favorites
// Returns all favorited motorcycles for the logged-in user,
// joined with motorcycle details and primary image.
exports.getFavorites = (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sql = `
    SELECT
      f.id        AS favorite_id,
      f.user_id,
      f.created_at AS favorited_at,
      m.*,
      mi.image_url
    FROM favorites f
    JOIN motorcycles m
      ON m.id = f.motorcycle_id
    LEFT JOIN motorcycle_images mi
      ON mi.motorcycle_id = m.id AND mi.is_primary = 1
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// POST /api/favorites/:motorcycleId
// Adds the motorcycle to favorites if not already there,
// or removes it if it already exists (toggle behaviour).
exports.toggleFavorite = (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const motorcycleId = Number(req.params.motorcycleId);
  if (!Number.isInteger(motorcycleId) || motorcycleId <= 0) {
    return res.status(400).json({ error: "Invalid motorcycle id" });
  }

  // Check whether this motorcycle is already favourited
  const checkSql = `
    SELECT id FROM favorites
    WHERE user_id = ? AND motorcycle_id = ?
    LIMIT 1
  `;

  db.query(checkSql, [userId, motorcycleId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows.length > 0) {
      // Already a favourite — remove it
      const deleteSql = `
        DELETE FROM favorites
        WHERE user_id = ? AND motorcycle_id = ?
      `;
      db.query(deleteSql, [userId, motorcycleId], (delErr) => {
        if (delErr) return res.status(500).json({ error: delErr.message });
        res.json({ favorited: false, message: "Removed from favorites" });
      });
    } else {
      // Not yet a favourite — add it
      const insertSql = `
        INSERT INTO favorites (user_id, motorcycle_id)
        VALUES (?, ?)
      `;
      db.query(insertSql, [userId, motorcycleId], (insErr, result) => {
        if (insErr) return res.status(500).json({ error: insErr.message });
        res.status(201).json({
          favorited: true,
          favorite_id: result.insertId,
          message: "Added to favorites",
        });
      });
    }
  });
};
