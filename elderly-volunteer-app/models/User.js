const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["elderly", "volunteer", "admin"],
      required: true,
    },
    phone: String,
    location: String,
    address: String,
    preferences: [String],
    availability: { type: Boolean, default: true },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    birthday: { type: Date },
    bio: { type: String, default: "" },
    deviceToken: { type: String, default: null },
    isOnline: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviews: [{ type: String }],
    skills: [String], // Kỹ năng (ví dụ: chăm sóc sức khỏe, trò chuyện, mua sắm)
    experience: { type: String, default: "" }, // Kinh nghiệm làm tình nguyện viên
    languages: [String], // Ngôn ngữ giao tiếp
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
