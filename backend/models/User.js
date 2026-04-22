// ============================
//  models/User.js
//  Passwords hashed with bcrypt
// ============================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name too short"],
      maxlength: [50, "Name too long"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"]
    }
  },
  { timestamps: true }
);

// ---- Hash password before saving ----
userSchema.pre("save", async function (next) {
  // Only hash if password was modified (or is new)
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12); // 12 rounds = strong encryption
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ---- Method to compare password at login ----
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ---- Never expose password in JSON responses ----
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
