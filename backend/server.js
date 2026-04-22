// ============================
//  ExpenseIQ — server.js
//  Node.js + Express + MongoDB
//  with JWT Authentication
// ============================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes    = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- Routes ----
app.use("/api/auth",     authRoutes);     // Public: signup / login
app.use("/api/expenses", expenseRoutes);  // Protected: requires JWT

// ---- Health Check ----
app.get("/", (req, res) => {
  res.json({ status: "✅ ExpenseIQ API running", version: "2.0.0", auth: "JWT + bcrypt" });
});

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ---- Connect to MongoDB & Start ----
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔐 Auth: JWT + bcrypt enabled`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });
