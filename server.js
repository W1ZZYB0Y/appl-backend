require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "https://jaws-student-allowanceprogram.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend

// Nodemailer transport setup using .env credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST route to handle form submission
app.post("/submit-form", async (req, res) => {
  const formData = req.body;

  // Save data to file
  const timestamp = Date.now();
  const filename = `data/form-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(formData, null, 2));

  // Email to user
  const userMail = {
    from: `"Application Team" <${process.env.EMAIL_USER}>`,
    to: formData.email,
    subject: "Your Application Has Been Received",
    text: `Dear ${formData.name},

Your application has been received successfully and is being processed.

We will notify you once there's an update.

Regards,
Application Team`,
  };

  // Email to admin
  const adminMail = {
    from: `"Application Bot" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: "New Application Submission",
    text: `A new application was submitted:

Name: ${formData.name}
Registration Number: ${formData.regNo}
Faculty: ${formData.faculty}
Department: ${formData.department}
CGPA: ${formData.cgpa}
Email: ${formData.email}
`,
  };

  try {
    await transporter.sendMail(userMail);
    await transporter.sendMail(adminMail);
    res.json({ message: "Application submitted and emails sent." });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Application saved but email failed." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
