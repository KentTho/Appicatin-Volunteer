const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { authenticate } = require("../middleware/authMiddleware");

// 🟢 Lấy danh sách hội thoại của user
router.get("/", authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name email avatar")
      .populate("lastMessage");

    res.status(200).json({ conversations });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách hội thoại:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách hội thoại." });
  }
});

// 🟠 Xóa một cuộc hội thoại
router.delete("/:conversationId", authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy hội thoại." });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa hội thoại này." });
    }

    await Message.deleteMany({ conversationId }); // Xóa tất cả tin nhắn trong hội thoại
    await Conversation.findByIdAndDelete(conversationId); // Xóa hội thoại

    res.status(200).json({ message: "Hội thoại đã được xóa." });
  } catch (error) {
    console.error("❌ Lỗi khi xóa hội thoại:", error);
    res.status(500).json({ message: "Lỗi khi xóa hội thoại." });
  }
});

module.exports = router;
