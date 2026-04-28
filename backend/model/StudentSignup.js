const mongoose = require("mongoose");

const studentSignupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: false },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: false,
    },
    mobileNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    institutionName: { type: String, required: true },
    programName: { type: String, required: true },
    courseDepartment: { type: String, required: true },
    year: { type: String, required: true },
    studentId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "banned"],
      default: "pending",
    },
    isBanned: { type: Boolean, default: false },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    rejectedReason: { type: String },
  },
  {
    timestamps: true,
    collection: "signup_student",
  },
);

module.exports = mongoose.model("StudentSignup", studentSignupSchema);
