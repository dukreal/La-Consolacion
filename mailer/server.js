const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Configure your Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "eryndra.quistal@gmail.com", // 1. CHANGE THIS
    pass: "auhx psgq xrme osll",
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: true,
  logger: true,
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

// Endpoint to send password reset email
app.post("/send-reset", async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    await transporter.sendMail({
      from: '"LA Consolacion Jewelry" <eryndra.quistal@gmail.com>', // 3. CHANGE THIS
      to,
      subject,
      text,
    });
    res.json({ success: true, message: "Reset email sent!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to send order notifications
app.post("/send-order-notification", async (req, res) => {
  const { to, subject, text } = req.body;

  console.log("Received order notification request:", {
    to,
    subject,
    text: text.substring(0, 100) + "...",
  });

  try {
    const mailOptions = {
      from: '"LA Consolacion Jewelry" <eryndra.quistal@gmail.com>', // 4. CHANGE THIS
      to,
      subject,
      text,
    };

    console.log("Sending email with options:", mailOptions);

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result);
    res.json({
      success: true,
      message: "Order notification sent!",
      messageId: result.messageId,
    });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Nodemailer server running on port ${PORT}`);
});