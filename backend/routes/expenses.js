// ============================
//  routes/expenses.js
//  All routes protected by JWT
//  Each user only sees their own data
// ============================

const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const { protect } = require("../middleware/auth");

// Apply auth middleware to ALL expense routes
router.use(protect);

// =============================
//  GET /api/expenses
//  Returns ONLY the logged-in user's expenses
// =============================
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id })
      .sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// =============================
//  POST /api/expenses
//  Create expense linked to logged-in user
// =============================
router.post("/", async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;

    if (!amount || !category || !date || !description) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const expense = new Expense({
      userId: req.user._id,  // 🔑 Bind to current user
      amount,
      category,
      date,
      description
    });

    const saved = await expense.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: "Validation error", message: err.message });
    }
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// =============================
//  DELETE /api/expenses/:id
//  Only the owner can delete their expense
// =============================
router.delete("/:id", async (req, res) => {
  try {
    // Find by BOTH id AND userId — prevents user A deleting user B's expense
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found or not authorized." });
    }

    res.json({ message: "Deleted successfully", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

module.exports = router;
