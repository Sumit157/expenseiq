// ============================
//  routes/expenses.js
// ============================

const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

// ---- GET /api/expenses ----
// Returns all expenses, newest first
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ---- POST /api/expenses ----
// Add a new expense
router.post("/", async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;

    // Basic validation
    if (!amount || !category || !date || !description) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const expense = new Expense({ amount, category, date, description });
    const saved = await expense.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: "Validation error", message: err.message });
    }
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ---- DELETE /api/expenses/:id ----
// Delete an expense by ID
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json({ message: "Deleted successfully", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

module.exports = router;
