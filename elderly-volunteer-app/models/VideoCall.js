const mongoose = require("mongoose");

const videoCallSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    callerRole: {
      type: String,
      enum: ["volunteer", "elderly"],
      required: true,
    }, // Vai trò của người gọi
    receiverRole: {
      type: String,
      enum: ["volunteer", "elderly"],
      required: true,
    }, // Vai trò của người nhận
    roomId: { type: String, required: true },
    callType: { type: String, enum: ["video", "audio"], default: "video" }, // Mở rộng thêm audio
    status: {
      type: String,
      enum: ["pending", "ongoing", "ended", "rejected", "missed", "cancelled"],
      default: "pending",
    },
    // Trạng thái chi tiết cuộc gọi
    isMissed: { type: Boolean, default: false }, // Cuộc gọi nhỡ
    callDuration: { type: Number, default: 0 }, // Thời lượng (giây)
    isDeleted: { type: Boolean, default: false }, // Xóa mềm
    startedAt: { type: Date, default: null }, // Bắt đầu
    endedAt: { type: Date, default: null }, // Kết thúc
    feedback: {
      type: String, // Nhận xét về cuộc gọi
      default: "",
    },
    rating: {
      type: Number, // Đánh giá chất lượng cuộc gọi
      min: 1,
      max: 5,
      default: 5,
    },
    recordedUrl: { type: String, default: null },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

const VideoCall = mongoose.model("VideoCall", videoCallSchema);
module.exports = VideoCall;
