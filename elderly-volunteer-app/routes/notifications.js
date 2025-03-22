const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { authenticate } = require("../middleware/authMiddleware");

// 🟢 Lấy danh sách thông báo chưa đọc của user
router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      isRead: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông báo:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thông báo.", error: error.message });
  }
});

// 🔵 Đánh dấu thông báo là đã đọc
router.put("/:notificationId/read", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });

    res.status(200).json({ message: "Thông báo đã được đánh dấu là đã đọc." });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật thông báo:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật thông báo.", error: error.message });
  }
});

module.exports = router;
