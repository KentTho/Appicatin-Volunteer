const express = require("express");
const router = express.Router();
const VideoCall = require("../models/VideoCall");
const { authenticate } = require("../middleware/authMiddleware");

// 1. Tạo cuộc gọi mới
router.post("/", authenticate, async (req, res) => {
  try {
    const { callerId, receiverId, callerRole, receiverRole, roomId, callType } =
      req.body;

    if (callerRole === receiverRole) {
      return res
        .status(400)
        .json({ message: "Cuộc gọi chỉ giữa volunteer và elderly." });
    }

    const existingCall = await VideoCall.findOne({
      $or: [
        { callerId, receiverId },
        { callerId: receiverId, receiverId: callerId },
      ],
      status: { $in: ["pending", "ongoing"] },
    });

    if (existingCall) {
      return res.status(400).json({
        message: "Đã có cuộc gọi đang diễn ra hoặc chờ.",
        existingCall,
      });
    }

    const newCall = new VideoCall({
      callerId,
      receiverId,
      callerRole,
      receiverRole,
      roomId,
      callType,
      status: "pending",
    });
    await newCall.save();
    res
      .status(201)
      .json({ message: "Tạo cuộc gọi thành công.", call: newCall });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi tạo cuộc gọi.", error: err.message });
  }
});
// 2. Hủy cuộc gọi
router.put("/cancel/:id", authenticate, async (req, res) => {
  try {
    const call = await VideoCall.findById(req.params.id);
    if (!call)
      return res.status(404).json({ message: "Không tìm thấy cuộc gọi." });
    if (call.status !== "pending")
      return res.status(400).json({ message: "Chỉ hủy cuộc gọi đang chờ." });

    call.status = "cancelled";
    await call.save();
    res.status(200).json({ message: "Hủy thành công.", call });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi hủy.", error: err.message });
  }
});
// 3. Chấp nhận cuộc gọi
router.put("/accept/:id", authenticate, async (req, res) => {
  try {
    const call = await VideoCall.findById(req.params.id);
    if (!call)
      return res.status(404).json({ message: "Không tìm thấy cuộc gọi." });
    if (call.status !== "pending")
      return res.status(400).json({ message: "Chỉ chấp nhận cuộc gọi chờ." });

    call.status = "ongoing";
    call.startedAt = new Date();
    await call.save();

    res.status(200).json({ message: "Đã chấp nhận cuộc gọi.", call });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi chấp nhận.", error: err.message });
  }
});
// 4. Từ chối cuộc gọi
router.put("/reject/:id", authenticate, async (req, res) => {
  try {
    const call = await VideoCall.findById(req.params.id);
    if (!call)
      return res.status(404).json({ message: "Không tìm thấy cuộc gọi." });
    if (call.status !== "pending")
      return res.status(400).json({ message: "Chỉ từ chối cuộc gọi chờ." });

    call.status = "rejected";
    await call.save();

    res.status(200).json({ message: "Đã từ chối cuộc gọi.", call });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi từ chối.", error: err.message });
  }
});
// 5. Lấy danh sách cuộc gọi gần đây
router.put("/end/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const call = await VideoCall.findById(id);
    if (!call)
      return res.status(404).json({ message: "Không tìm thấy cuộc gọi." });
    if (call.status !== "ongoing")
      return res
        .status(400)
        .json({ message: "Chỉ kết thúc cuộc đang diễn ra." });

    call.status = "ended";
    call.endedAt = new Date();
    call.callDuration = Math.floor((call.endedAt - call.startedAt) / 1000); // Tính bằng giây
    await call.save();

    res.status(200).json({ message: "Kết thúc cuộc gọi thành công.", call });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi kết thúc.", error: err.message });
  }
});
//6. Đánh giá cuộc gọi
router.put("/rate/:id", authenticate, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const call = await VideoCall.findById(req.params.id);
    if (!call)
      return res.status(404).json({ message: "Không tìm thấy cuộc gọi." });
    if (call.status !== "ended")
      return res
        .status(400)
        .json({ message: "Chỉ đánh giá cuộc đã kết thúc." });

    call.rating = rating;
    call.feedback = feedback;
    await call.save();

    res.status(200).json({ message: "Đánh giá cuộc gọi thành công.", call });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi đánh giá.", error: err.message });
  }
});
// 7. Lấy danh sách cuộc gọi gần đây
router.get("/recent", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const recentCalls = await VideoCall.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res
      .status(200)
      .json({ message: "Danh sách cuộc gọi gần đây.", recentCalls });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách.", error: err.message });
  }
});
//8. Lấy chi tiết 1 cuộc gọi
router.get("/:id", authenticate, async (req, res) => {
  try {
    const call = await VideoCall.findById(req.params.id);
    if (!call)
      return res.status(404).json({ message: "Không tìm thấy cuộc gọi." });

    res.status(200).json({ call });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy chi tiết.", error: err.message });
  }
});
module.exports = router;
