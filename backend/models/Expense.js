// ============================
//  models/Expense.js
// ============================

const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    // 🔑 Links expense to its owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true  // speeds up per-user queries
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be positive"]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Food", "Travel", "Shopping", "Entertainment", "Health", "Bills", "Education", "Other"]
    },
    date: {
      type: Date,
      required: [true, "Date is required"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [100, "Description too long"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
