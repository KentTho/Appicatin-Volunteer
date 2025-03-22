const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  // Xác định hội thoại (dùng ObjectId thay vì String)
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  // Người gửi
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Người nhận (nếu là tin nhắn riêng tư)
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // Nếu là nhóm thì null
  },
  // Thuộc về nhóm nào (nếu là nhóm chat)
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null,
  },
  // Nội dung tin nhắn dạng text
  content: {
    type: String,
    default: null,
    validate: {
      validator: function (value) {
        return value !== null || (this.media && this.media.length > 0);
      },
      message: "Tin nhắn phải có nội dung hoặc media!",
    },
  },
  // Danh sách media (cho phép gửi nhiều file/media 1 lúc)
  media: [
    {
      url: { type: String, required: true },
      type: { type: String, enum: ["image", "video", "file"], required: true },
      size: { type: Number },
      format: { type: String },
      filename: { type: String },
    },
  ],
  // Thời gian gửi
  timestamp: { type: Date, default: Date.now },
  // Trạng thái đã đọc
  isRead: { type: Boolean, default: false },
  seenAt: { type: Date, default: null },
  // Trạng thái đã nhận tin nhắn
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date, default: null },
  // Xóa mềm
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Hỗ trợ trả lời tin nhắn
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null,
  },
  // Loại tin nhắn
  messageType: {
    type: String,
    enum: ["text", "call", "sticker", "notification"],
    default: "text",
  },
  isSystem: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  important: { type: Boolean, default: false },
  // Thả cảm xúc
  reactions: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      type: {
        type: String,
        enum: ["like", "love", "haha", "wow", "sad", "angry"],
      },
      reactedAt: { type: Date, default: Date.now },
    },
  ],
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  editHistory: [
    { content: String, editedAt: { type: Date, default: Date.now } },
  ],
});

// 🛠 Index tối ưu hiệu suất
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 }); // 🔥 Thêm index tối ưu

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
