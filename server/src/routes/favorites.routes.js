const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favorites.controller");
const { authenticate } = require("../middleware/auth.middleware");

// Both routes require a logged-in user
router.get("/favorites", authenticate, favoritesController.getFavorites);
router.post("/favorites/:motorcycleId", authenticate, favoritesController.toggleFavorite);

module.exports = router;
