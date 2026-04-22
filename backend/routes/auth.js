// ============================
//  routes/auth.js
//  POST /api/auth/signup
//  POST /api/auth/login
// ============================

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ---- Helper: generate JWT ----
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// =============================
//  POST /api/auth/signup
// =============================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one number." });
    }

    // Check if email already registered
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered. Please sign in." });
    }

    // Create user (password auto-hashed via pre-save hook in User model)
    const user = await User.create({ name, email, password });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map(e => e.message).join(". ");
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: "Server error during signup." });
  }
});

// =============================
//  POST /api/auth/login
// =============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Use same generic message for wrong email OR wrong password (security best practice)
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Compare password against bcrypt hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login." });
  }
});

module.exports = router;
