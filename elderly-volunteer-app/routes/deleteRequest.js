const express = require("express");
const router = express.Router();
const DeleteRequest = require("../models/DeleteRequest");
const User = require("../models/User");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware"); // Import middleware
// 1. User gửi yêu cầu xóa tài khoản với lý do
router.post("/request-delete-account", authenticate, async (req, res) => {
  try {
    const userId = req.user._id; // Lấy từ token
    const { reason } = req.body; // Lý do xóa

    const existingRequest = await DeleteRequest.findOne({ userId });
    if (existingRequest)
      return res.status(400).json({ message: "Bạn đã gửi yêu cầu trước đó." });

    const request = new DeleteRequest({
      userId,
      reason: reason || "Không rõ lý do", // Nếu không ghi lý do thì để trống
    });
    await request.save();

    res.status(201).json({ message: "Yêu cầu xóa tài khoản đã được gửi." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
});

// 2. Admin phê duyệt yêu cầu xóa tài khoản
router.put(
  "/approve-delete/:userId",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Kiểm tra user tồn tại
      const user = await User.findById(userId);
      if (!user)
        return res.status(404).json({ message: "Người dùng không tồn tại!" });

      // Cập nhật yêu cầu xóa thành "approved" và lưu thời gian xử lý
      await DeleteRequest.findOneAndUpdate(
        { userId },
        { status: "approved", processedAt: new Date() }
      );

      // Xóa user
      await User.findByIdAndDelete(userId);

      // Gửi email thông báo
      await sendEmail({
        to: user.email,
        subject: "Tài khoản đã bị xóa",
        text: "Tài khoản của bạn đã được xóa theo yêu cầu. Nếu đây là nhầm lẫn, vui lòng liên hệ hỗ trợ.",
      });

      res.status(200).json({ message: "Người dùng đã được xóa thành công!" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server!", error });
    }
  }
);
//3. Admin từ chối yêu cầu xóa tài khoản
router.put(
  "/reject-delete/:userId",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Kiểm tra yêu cầu tồn tại
      const deleteRequest = await DeleteRequest.findOne({ userId });
      if (!deleteRequest)
        return res.status(404).json({ message: "Không tìm thấy yêu cầu xóa." });

      // Cập nhật trạng thái "rejected" và thời gian xử lý
      deleteRequest.status = "rejected";
      deleteRequest.processedAt = new Date();
      await deleteRequest.save();

      // Gửi email thông báo từ chối
      const user = await User.findById(userId);
      await sendEmail({
        to: user.email,
        subject: "Yêu cầu xóa tài khoản bị từ chối",
        text: "Yêu cầu xóa tài khoản của bạn đã bị từ chối. Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ với quản trị viên.",
      });

      res.status(200).json({ message: "Đã từ chối yêu cầu xóa tài khoản." });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server!", error });
    }
  }
);
//4. Admin lấy danh sách các yêu cầu xóa (quản lý)
router.get(
  "/requests",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const requests = await DeleteRequest.find()
        .populate({ path: "userId", select: "name email role" })
        .sort({ createdAt: -1 });
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ message: "Lỗi server!", error });
    }
  }
);
module.exports = router;
