const express = require("express");
const router = express.Router();
const bikesController = require("../controllers/bikes.controller"); //import the controller
const path = require("path");
const multer = require("multer");
const { authenticate, authorize } = require("../middleware/auth.middleware"); //import the middleware

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "assets", "uploads", "images"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const upload = multer({ storage });

router.get("/bikes", bikesController.getAllBikes);
router.get("/bikes/:id", bikesController.getBikeById); 
router.get("/bikes/:id/image", bikesController.getBikeImage);

// seller-only writes
router.post("/bikes", authenticate, authorize("seller"), upload.single("image"), bikesController.createBike); // thiss creates a new bike
router.put("/bikes/:id", authenticate, authorize("seller"), bikesController.updateBike); // thiss updates a bike
router.delete("/bikes/:id", authenticate, authorize("seller"), bikesController.deleteBike); // thiss deletes a bike
router.post("/bikes/:id/image", authenticate, authorize("seller"), bikesController.uploadBikeImage);

module.exports = router;