// controllers/paymentController.js — Razorpay payment flow + notifications
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const { createNotificationsForUsers, notifyAdmins } = require("./notificationController");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order (Step 1 of payment flow)
// @route   POST /api/payments/create-order
// @access  Private (Student)
exports.createOrder = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    // Check course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });
    if (existingEnrollment) {
      return res.status(400).json({ success: false, message: "Already enrolled in this course." });
    }

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = course.price * 100;

    // Create Razorpay order (or mock order if keys are dummy)
    let razorpayOrder;
    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes("dummy");

    if (isMock) {
      razorpayOrder = {
        id: `order_mock_${crypto.randomBytes(8).toString("hex")}`,
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
        notes: {
          userId: req.user._id.toString(),
          courseId: courseId.toString(),
        },
      };
    } else {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
        notes: {
          userId: req.user._id.toString(),
          courseId: courseId.toString(),
        },
      });
    }

    // Save pending payment record in DB
    await Payment.create({
      user: req.user._id,
      course: courseId,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      status: "created",
    });

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      course: {
        title: course.title,
        price: course.price,
      },
      key: process.env.RAZORPAY_KEY_ID, // Send to frontend for Razorpay checkout
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment signature & enroll user (Step 2 of payment flow)
// @route   POST /api/payments/verify
// @access  Private (Student)
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;

    const isMock = razorpay_order_id && razorpay_order_id.startsWith("order_mock_");

    if (!isMock) {
      // Generate signature to verify payment authenticity
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      // Compare signatures
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
      }
    }

    // Update payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: isMock ? "mock_signature" : razorpay_signature,
        status: "paid",
      }
    );

    // Enroll user in the course
    const existingEnrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
    if (!existingEnrollment) {
      await Enrollment.create({ user: req.user._id, course: courseId });

      // Update user's enrolled courses
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { enrolledCourses: courseId },
      });

      // Update course's student list
      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { studentsEnrolled: req.user._id },
      });

      // 🔔 Notify student about successful purchase
      try {
        const course = await Course.findById(courseId).select("title");
        await createNotificationsForUsers([req.user._id], {
          type: "enrollment",
          title: "Purchase Successful! 🎉",
          message: `You've purchased and enrolled in "${course?.title}". Start learning now!`,
          relatedCourse: courseId,
          audience: "student",
        });

        // 🔔 Notify admins about new paid enrollment
        await notifyAdmins({
          type: "enrollment",
          title: "New Paid Enrollment 💰",
          message: `${req.user.name} purchased "${course?.title}"`,
          relatedCourse: courseId,
          relatedUser: req.user._id,
        });
      } catch (notifErr) {
        console.error("Notification error:", notifErr);
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified! Enrolled in course successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history of logged-in user
// @route   GET /api/payments/my
// @access  Private (Student)
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id, status: "paid" })
      .populate("course", "title thumbnail instructor price")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};
