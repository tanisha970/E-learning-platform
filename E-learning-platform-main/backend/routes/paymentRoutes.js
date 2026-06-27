// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment, getMyPayments } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/my", protect, getMyPayments);

module.exports = router;
