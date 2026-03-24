const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

// Protect all admin routes
router.use(authenticate, authorize("admin"));

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.put("/users/:id/status", adminController.toggleUserStatus);

module.exports = router;
