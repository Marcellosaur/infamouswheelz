const db = require("../config/db");

const ALLOWED_FIELDS = [
  "seller_id",
  "title",
  "brand",
  "price",
  "year",
  "engine_size",
  "condition",
  "description",
  "status"
];

const REQUIRED_FIELDS = [
  "seller_id",
  "title",
  "brand",
  "price",
  "year",
  "condition"
];

const buildFields = (body) => {
  const fields = [];
  const values = [];

  ALLOWED_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined) {
      fields.push(field);
      values.push(body[field]);
    }
  });

  return { fields, values };
};

exports.getAllBikes = (req, res) => {
  const conditions = req.query.condition
    ? req.query.condition.split(',').map(c => c.trim()).filter(Boolean)
    : [];

  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);

  let sql = `
    SELECT m.*, mi.image_url
    FROM motorcycles m
    LEFT JOIN motorcycle_images mi
      ON mi.motorcycle_id = m.id AND mi.is_primary = 1
  `; // thiss is the sql query to get all bikes

  const filters = [];
  const params = [];

  if (!Number.isNaN(minPrice)) {
    filters.push("m.price >= ?");
    params.push(minPrice);
  }
  if (!Number.isNaN(maxPrice)) {
    filters.push("m.price <= ?");
    params.push(maxPrice);
  }
  if (conditions.length > 0) {
    filters.push(`m.condition IN (${conditions.map(() => '?').join(',')})`);
    params.push(...conditions);
  }

  if (filters.length > 0) {
    sql += ` WHERE ${filters.join(' AND ')}`;
  }

  sql += ` ORDER BY m.created_at DESC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getBikeById = (req, res) => {
  const bikeId = Number(req.params.id);
  if (!Number.isInteger(bikeId)) {
    return res.status(400).json({ error: "Invalid bike id" });
  } // 

  const sql = `
    SELECT m.*,
           mi.image_url
    FROM motorcycles m
    LEFT JOIN motorcycle_images mi
      ON mi.motorcycle_id = m.id AND mi.is_primary = 1
    WHERE m.id = ?
    LIMIT 1
  `;

  db.query(sql, [bikeId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ error: "Bike not found" });
    }
    res.json(results[0]);
  });
};

exports.createBike = (req, res) => {
  const body = req.body || {};
  const imageFile = req.file;

  if (body.seller_id === undefined || body.seller_id === null || body.seller_id === "") {
    if (req.user?.id) {
      body.seller_id = req.user.id;
    }
  }

  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }
  if (!imageFile) {
    return res.status(400).json({ error: "Image file is required" });
  }

  const { fields, values } = buildFields(body);
  if (fields.length === 0) {
    return res.status(400).json({ error: "No valid fields provided" });
  }

  const placeholders = fields.map(() => "?").join(", ");
  const sql = `INSERT INTO motorcycles (${fields.map(f => f === "condition" ? "`condition`" : f).join(", ")})
               VALUES (${placeholders})`;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const bikeId = result.insertId;
    const imageUrl = `/uploads/images/${imageFile.filename}`;

    const imageSql = `INSERT INTO motorcycle_images (motorcycle_id, image_url, is_primary)
                      VALUES (?, ?, 1)`;

    db.query(imageSql, [bikeId, imageUrl], (imageErr) => {
      if (imageErr) return res.status(500).json({ error: imageErr.message });
      res.status(201).json({ message: "Bike created", id: bikeId });
    });
  });
};

exports.updateBike = (req, res) => {
  const bikeId = Number(req.params.id);
  if (!Number.isInteger(bikeId)) {
    return res.status(400).json({ error: "Invalid bike id" });
  }

  const { fields, values } = buildFields(req.body || {});
  if (fields.length === 0) {
    return res.status(400).json({ error: "No valid fields provided" });
  }

  const setClause = fields
    .map((field) => `${field === "condition" ? "`condition`" : field} = ?`)
    .join(", ");

  const sql = `UPDATE motorcycles SET ${setClause} WHERE id = ?`;

  db.query(sql, [...values, bikeId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bike not found" });
    }
    res.json({ message: "Bike updated" });
  });
};

exports.deleteBike = (req, res) => {
  const bikeId = Number(req.params.id);
  if (!Number.isInteger(bikeId)) {
    return res.status(400).json({ error: "Invalid bike id" });
  }

  db.query("DELETE FROM motorcycles WHERE id = ?", [bikeId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bike not found" });
    }
    res.json({ message: "Bike deleted" });
  });
};

exports.uploadBikeImage = (req, res) => {
  const bikeId = Number(req.params.id);
  if (!Number.isInteger(bikeId)) {
    return res.status(400).json({ error: "Invalid Bike ID" });
  }

  const { image_url } = req.body || {};
  if (!image_url) {
    return res.status(400).json({ error: "image_url is required" });
  }

  const sql = `INSERT INTO motorcycle_images (motorcycle_id, image_url, is_primary)
               VALUES (?, ?, 1)`;

  db.query(sql, [bikeId, image_url], (err) =>{
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Image Uploaded" });
  });
};

exports.getBikeImage = (req, res) => {
  const bikeId = Number(req.params.id);
  if (!Number.isInteger(bikeId)) {
    return res.status(400).json({ error: "Invalid bike id" });
  }

  const sql = `SELECT image_url
               FROM motorcycle_images 
               WHERE motorcycle_id = ? AND is_primary = 1 
               LIMIT 1`

  db.query(sql, [bikeId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({  error: "Image not Found"});
    }

    const { image_url } = results[0];
    res.json({ image_url });
  });             
};