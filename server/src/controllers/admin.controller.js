const db = require("../config/db");

exports.getStats = (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM motorcycles WHERE status = 'Available') AS activeListings,
      (SELECT COUNT(*) FROM users WHERE is_active = false) AS suspendedUsers
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching stats" });
    }
    
    const stats = results[0] || {};
    res.json({
      totalUsers: stats.totalUsers || 0,
      activeListings: stats.activeListings || 0,
      suspendedUsers: stats.suspendedUsers || 0,
      pendingReports: 0 // Mocked for now until reports table is created
    });
  });
};

exports.getUsers = (req, res) => {
  const query = "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC";
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching users" });
    }
    // MySQL tinyint(1) comes back as 0 or 1. Let's send true/false for ease of use.
    const mappedUsers = results.map(u => ({ ...u, is_active: !!u.is_active }));
    res.json(mappedUsers);
  });
};

exports.toggleUserStatus = (req, res) => {
  const userId = req.params.id;
  const { is_active } = req.body;

  const query = "UPDATE users SET is_active = ? WHERE id = ?";
  db.query(query, [is_active === true ? 1 : 0, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating status" });
    }
    res.json({ message: "Status updated successfully" });
  });
};
