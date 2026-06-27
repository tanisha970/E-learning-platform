// controllers/authController.js — Updated with profile update + password change
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Helper: Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Helper: Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrolledCourses: user.enrolledCourses,
    },
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "Please provide name, email, and password." });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "Email already registered." });

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
      name,
      email,
      password,
      role: role === "admin" ? "admin" : "student",
      isVerified: false,
      verificationToken: token,
      verificationTokenExpire: expiry,
    });

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}&email=${email}`;

    // Mail content
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to LearnHub! 🎓</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering. Please activate your account by verifying your email address.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">If the button above does not work, copy and paste this URL into your browser:</p>
        <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">This verification link will expire in 24 hours.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "LearnHub — Verify your email address ✉️",
        html,
      });
      res.status(201).json({
        success: true,
        message: "Verification email sent. Please check your inbox to activate your account.",
      });
    } catch (err) {
      // Cleanup token on mail failure
      user.verificationToken = undefined;
      user.verificationTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: "Error sending verification email. Please try again." });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Please provide email and password." });

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ success: false, message: "No user available with this email." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    // Block login for unverified users
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        isVerified: false,
        message: "Please verify your email address to log in.",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("enrolledCourses", "title thumbnail instructor");
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile (name only)
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: "Name is required." });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Please provide current and new password." });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Current password is incorrect." });

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully!" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students (Admin only)
// @route   GET /api/auth/students
// @access  Private/Admin
exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student (Admin only)
// @route   DELETE /api/auth/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    if (user.role === "admin")
      return res.status(403).json({ success: false, message: "Cannot delete admin users." });

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.query;
    console.log("🔍 verifyEmail received query:", { token, email });

    if (!token || !email) {
      return res.status(400).json({ success: false, message: "Invalid verification link." });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationToken: token,
      verificationTokenExpire: { $gt: new Date() },
    });

    console.log("👤 user found in db:", user ? user.email : "none");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token.",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide an email address." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with this email." });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "This account has already been verified. Please log in." });
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}&email=${user.email}`;

    // Mail content
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to LearnHub! 🎓</h2>
        <p>Hello ${user.name},</p>
        <p>Please activate your account by verifying your email address.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">If the button above does not work, copy and paste this URL into your browser:</p>
        <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">This verification link will expire in 24 hours.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "LearnHub — Verify your email address ✉️",
      html,
    });

    res.status(200).json({
      success: true,
      message: "Verification email resent! Please check your inbox.",
    });
  } catch (error) {
    next(error);
  }
};