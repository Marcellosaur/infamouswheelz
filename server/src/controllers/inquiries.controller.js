const db = require("../config/db");

// GET /api/inquiries
// Returns all inquiries sent by the logged-in buyer,
// joined with motorcycle title and seller name.
exports.getBuyerInquiries = (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sql = `
    SELECT
      i.id,
      i.message,
      i.status,
      i.created_at,
      m.id          AS motorcycle_id,
      m.title       AS motorcycle_title,
      m.brand       AS motorcycle_brand,
      m.year        AS motorcycle_year,
      u.name        AS seller_name
    FROM inquiries i
    JOIN motorcycles m ON m.id = i.motorcycle_id
    JOIN users u       ON u.id = m.seller_id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// GET /api/inquiries/seller
// Returns all inquiries for the logged-in seller's motorcycles
exports.getSellerInquiries = (req, res) => {
  const sellerId = req.user?.id;
  if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

  const sql = `
    SELECT
      i.id,
      i.message,
      i.status,
      i.created_at,
      m.id          AS motorcycle_id,
      m.title       AS motorcycle_title,
      m.price       AS motorcycle_price,
      mi.image_url  AS motorcycle_image,
      u.id          AS buyer_id,
      u.name        AS buyer_name,
      u.created_at  AS buyer_since
    FROM inquiries i
    JOIN motorcycles m ON m.id = i.motorcycle_id
    JOIN users u       ON u.id = i.user_id
    LEFT JOIN motorcycle_images mi ON mi.motorcycle_id = m.id AND mi.is_primary = 1
    WHERE m.seller_id = ?
    ORDER BY i.created_at DESC
  `;

  db.query(sql, [sellerId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// PUT /api/inquiries/:id/status
// Update inquiry status (Approved / Rejected) if it belongs to the seller
exports.updateInquiryStatus = (req, res) => {
  const sellerId = req.user?.id;
  const inquiryId = req.params.id;
  const { status } = req.body;

  if (!sellerId) return res.status(401).json({ error: "Unauthorized" });
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  // Ensure seller owns the associated motorcycle
  const checkSql = `
    SELECT i.id 
    FROM inquiries i
    JOIN motorcycles m ON i.motorcycle_id = m.id
    WHERE i.id = ? AND m.seller_id = ?
  `;

  db.query(checkSql, [inquiryId, sellerId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ error: "Inquiry not found or unauthorized" });
    }

    const updateSql = `UPDATE inquiries SET status = ? WHERE id = ?`;
    db.query(updateSql, [status, inquiryId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Inquiry updated successfully", status });
    });
  });
};

// POST /api/inquiries
// Creates a new inquiry for a specific motorcycle
exports.createInquiry = (req, res) => {
  const buyerId = req.user?.id;
  const { motorcycle_id, message } = req.body;

  if (!buyerId) return res.status(401).json({ error: "Unauthorized" });
  if (!motorcycle_id || !message) {
    return res.status(400).json({ error: "motorcycle_id and message are required" });
  }

  // Prevent users from inquiring about their own bikes
  const checkSql = `SELECT seller_id FROM motorcycles WHERE id = ?`;
  db.query(checkSql, [motorcycle_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Motorcycle not found" });

    if (results[0].seller_id === buyerId) {
      return res.status(400).json({ error: "You cannot inquire about your own motorcycle" });
    }

    const sql = `INSERT INTO inquiries (user_id, motorcycle_id, message, status) VALUES (?, ?, ?, 'Pending')`;
    db.query(sql, [buyerId, motorcycle_id, message], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Inquiry sent successfully" });
    });
  });
};
