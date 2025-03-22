const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const multer = require("multer");
const path = require("path");
const { authenticate } = require("../middleware/authMiddleware");
const { getIo, onlineUsers } = require("../socket");

const io = getIo();

// Cấu hình multer để lưu trữ file trong thư mục 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// API upload media
router.post("/upload", authenticate, upload.single("media"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không có file nào được tải lên!" });
  }

  res.status(200).json({
    message: "File đã được tải lên thành công!",
    filePath: req.file.path,
  });
});

// API gửi tin nhắn
router.post("/send", authenticate, async (req, res) => {
  try {
    const { receiverId, content, media } = req.body;
    const senderId = req.user._id;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res
        .status(400)
        .json({ message: "Người gửi hoặc người nhận không tồn tại!" });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "Không thể gửi tin nhắn cho chính mình!" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
      });
      await conversation.save();
    }

    // Xử lý media thành mảng object đúng định dạng
    let mediaArray = [];
    if (media) {
      mediaArray = [
        {
          url: media, // Đường dẫn từ request
          type: media.match(/\.(jpg|jpeg|png|gif)$/i) ? "image" : "file", // Xác định type dựa trên đuôi file
          filename: path.basename(media), // Lấy tên file từ đường dẫn
        },
      ];
    }

    const message = new Message({
      senderId,
      receiverId,
      content,
      media: mediaArray.length > 0 ? mediaArray : undefined, // Chỉ gán nếu có media
      conversationId: conversation._id,
      isDelivered: onlineUsers.has(receiverId.toString()),
      deliveredAt: onlineUsers.has(receiverId.toString()) ? new Date() : null,
    });

    await message.save();

    conversation.lastMessage = message._id;
    await conversation.save();

    const receiverSockets = onlineUsers.get(receiverId.toString());
    if (receiverSockets) {
      receiverSockets.forEach((socketId) =>
        io.to(socketId).emit("receive_message", message)
      );
    }

    const senderSockets = onlineUsers.get(senderId.toString());
    if (senderSockets) {
      senderSockets.forEach((socketId) =>
        io.to(socketId).emit("receive_message", message)
      );
    }

    res.status(200).json({
      message: "Tin nhắn đã được gửi thành công!",
      data: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã có lỗi xảy ra khi gửi tin nhắn." });
  }
});

// Các route khác giữ nguyên
router.get("/conversations/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "name email role",
      })
      .populate({
        path: "lastMessage",
        select: "content createdAt",
      });

    if (conversations.length === 0) {
      return res.status(404).json({ message: "Không có cuộc trò chuyện nào." });
    }

    res.status(200).json({ data: conversations });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Đã có lỗi xảy ra khi lấy danh sách cuộc trò chuyện." });
  }
});

router.get("/unread/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadMessages = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    res.status(200).json({ unreadMessages });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Đã có lỗi xảy ra khi đếm tin nhắn chưa đọc." });
  }
});

router.get("/messages/:conversationId", authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({ conversationId })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: 1 });

    res.status(200).json({ data: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã có lỗi xảy ra khi lấy tin nhắn." });
  }
});

router.get("/checkReceiver/:receiverId", authenticate, async (req, res) => {
  try {
    const { receiverId } = req.params;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(400).json({ message: "Người nhận không tồn tại!" });
    }

    res.status(200).json({ message: "Người nhận hợp lệ!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Đã có lỗi xảy ra khi kiểm tra người nhận." });
  }
});

module.exports = router;
