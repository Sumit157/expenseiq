// ============================
//  middleware/auth.js
//  JWT Token Verification
// ============================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired. Please sign in again." });
      }
      return res.status(401).json({ error: "Invalid token." });
    }

    // 3. Find user (exclude password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: "Auth middleware error", message: err.message });
  }
};

module.exports = { protect };
