// utils/sendEmail.js — Reusable nodemailer utility with console fallback
const nodemailer = require("nodemailer");

/**
 * Send an email using nodemailer or log to console in development.
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 */
const sendEmail = async (options) => {
  const isSmtpConfigured =
    process.env.SMTP_HOST ||
    process.env.SMTP_USER ||
    process.env.SMTP_SERVICE;

  if (!isSmtpConfigured) {
    console.log("\n========================================================");
    console.log("✉️  [MAIL LOG] SMTP credentials not set. Falling back to console:");
    console.log(`To:      ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log("------------------ Content -----------------------------");
    // Extract verify link for convenience in console view
    const linkMatch = options.html.match(/href="([^"]+)"/);
    if (linkMatch && linkMatch[1]) {
      console.log(`🔗 Verification Link:\n   ${linkMatch[1]}`);
    } else {
      console.log(options.html.replace(/<[^>]*>/g, " ").trim());
    }
    console.log("========================================================\n");
    return;
  }

  // Create transporter
  const transporterOpts = {};

  if (process.env.SMTP_SERVICE) {
    transporterOpts.service = process.env.SMTP_SERVICE;
  } else {
    transporterOpts.host = process.env.SMTP_HOST;
    transporterOpts.port = parseInt(process.env.SMTP_PORT) || 587;
  }

  transporterOpts.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };

  const transporter = nodemailer.createTransport(transporterOpts);

  // Message details
  const message = {
    from: process.env.SMTP_FROM || `"LearnHub Support" <noreply@learnhub.com>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  console.log(`✅ Verification email sent to ${options.email} (ID: ${info.messageId})`);
};

module.exports = sendEmail;
