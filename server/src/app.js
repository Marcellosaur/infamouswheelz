const express = require("express");
const path = require("path");
const cors = require("cors");
const db = require("./config/db");

const app = express();

const authRoutes = require("./routes/auth.routes");
const bikesRoutes = require("./routes/bikes.routes");
const favoritesRoutes = require("./routes/favorites.routes");
const inquiriesRoutes = require("./routes/inquiries.routes");
const adminRoutes = require("./routes/admin.routes");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "assets", "uploads")));

app.get("/", (req, res) => {
  res.send("API running");
});

const { authenticate } = require("./middleware/auth.middleware");

app.use("/api", authRoutes);
app.use("/api", bikesRoutes);
app.use("/api", favoritesRoutes);
app.use("/api", inquiriesRoutes);
app.use("/api/admin", adminRoutes);
app.get("/api/protected", authenticate, (req, res) => {
  res.json({ message: "You are authenticated!", user: req.user });
});

module.exports = app;
