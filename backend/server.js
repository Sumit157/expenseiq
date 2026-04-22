// ============================
//  ExpenseIQ — server.js
//  Node.js + Express + MongoDB
// ============================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const expenseRoutes = require("./routes/expenses");

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- Routes ----
app.use("/api/expenses", expenseRoutes);

// ---- Health Check ----
app.get("/", (req, res) => {
  res.json({ status: "✅ ExpenseIQ API is running", version: "1.0.0" });
});

// ---- Connect to MongoDB & Start ----
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
