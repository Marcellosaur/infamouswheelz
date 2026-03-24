const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.register = async (req, res) => {
  try {
    if(req.body == null){
      return res.status(400).json({ message: "All fields required" });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)`;

    db.query(sql, [name, email, hashedPassword, role || "buyer"], (err, result) => {
      if (err) {
        return res.status(400).json({ message: "Email already exist" });
      }
      const token = jwt.sign(
        { id: result.insertId, role: role || "buyer" },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      res.status(201).json({ message: "User registered successfully", token });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM users
    WHERE email = ? AND is_active = TRUE`;

    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials or user diabled' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });
    });
};

exports.getMe = (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sql = `SELECT id, name, email, role FROM users WHERE id = ? AND is_active = TRUE LIMIT 1`;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(results[0]);
  });
};

exports.getSellerById = (req, res) => {
  const sellerId = Number(req.params.id);
  if (!Number.isInteger(sellerId) || sellerId <= 0) {
    return res.status(400).json({ error: 'Invalid seller id' });
  }

  const sql = `SELECT id, name, created_at FROM users WHERE id = ? AND role = 'seller' AND is_active = TRUE LIMIT 1`;
  db.query(sql, [sellerId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    res.json(results[0]);
  });
};
