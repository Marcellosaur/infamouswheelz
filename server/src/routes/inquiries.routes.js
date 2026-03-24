const express = require("express");
const router = express.Router();
const inquiriesController = require("../controllers/inquiries.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.get("/inquiries", authenticate, inquiriesController.getBuyerInquiries);
router.get("/inquiries/seller", authenticate, inquiriesController.getSellerInquiries);
router.post("/inquiries", authenticate, inquiriesController.createInquiry);
router.put("/inquiries/:id/status", authenticate, inquiriesController.updateInquiryStatus);

module.exports = router;
