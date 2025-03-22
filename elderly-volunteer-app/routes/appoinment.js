const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appoinment");
const router = express.Router();
const User = require("../models/User"); // Đường dẫn chính xác tới models/User.js
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");
const sendEmail = require("../utils/sendEmail"); // Thêm module gửi email
// Tạo lịch hẹn mới
router.post(
  "/create",
  authenticate,
  authorizeRole("elderly"),
  async (req, res) => {
    try {
      console.log("📥 Dữ liệu nhận từ client:", req.body); // 🔍 Kiểm tra `date`

      const { elderlyId, volunteerId, notes, date } = req.body;

      // 🔥 Chuyển đổi `date` từ string sang `Date`
      const appointmentDate = new Date(date);

      if (isNaN(appointmentDate.getTime())) {
        return res.status(400).json({ message: "Ngày hẹn không hợp lệ!" });
      }

      const newAppointment = new Appointment({
        elderlyId,
        volunteerId,
        date: appointmentDate, // 🔥 Lưu đúng kiểu `Date`
        notes,
        status: "pending",
      });

      await newAppointment.save();
      res.status(201).json({
        message: "Tạo cuộc hẹn thành công!",
        appointment: newAppointment,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi tạo cuộc hẹn", error: error.message });
    }
  }
);

// Lấy danh sách cuộc hẹn người dùng (lọc theo trạng thái)
router.get("/userAppointments/:id", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    let filter = { $or: [{ elderlyId: userId }, { volunteerId: userId }] };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate([
        { path: "elderlyId", select: "name avatar email" },
        { path: "volunteerId", select: "name avatar email" },
      ])
      .select("date status notes elderlyId volunteerId rating comment"); // 🟢 Thêm rating & comment vào select

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách lịch hẹn.", error });
  }
});

// Cập nhật thông tin cuộc hẹn (có kiểm tra chủ sở hữu)
router.put("/update/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const validStatuses = ["pending", "confirmed", "completed", "canceled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });
    }

    const appointment = await Appointment.findById(id).populate([
      "elderlyId",
      "volunteerId",
    ]);
    if (!appointment)
      return res.status(404).json({ message: "Không tìm thấy cuộc hẹn." });

    if (
      appointment.elderlyId._id.toString() !== req.user._id.toString() &&
      appointment.volunteerId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Không có quyền chỉnh sửa cuộc hẹn này." });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;
    await appointment.save();

    await sendEmail({
      to: [appointment.elderlyId.email, appointment.volunteerId.email],
      subject: "Cập nhật trạng thái cuộc hẹn",
      text: `Cuộc hẹn vào ngày ${appointment.date.toLocaleString()} đã được cập nhật sang trạng thái: ${status}.`,
    });

    res
      .status(200)
      .json({ message: "Cập nhật cuộc hẹn thành công!", appointment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật cuộc hẹn.", error });
  }
});
// Xóa cuộc hẹn
router.delete("/delete/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment)
      return res.status(404).json({ message: "Không tìm thấy cuộc hẹn!" });

    if (appointment.status !== "pending") {
      return res.status(400).json({
        message: "Không thể xóa cuộc hẹn sau khi đã xác nhận hoặc hoàn tất.",
      });
    }

    await appointment.deleteOne();
    res.status(200).json({ message: "Xóa cuộc hẹn thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Xóa cuộc hẹn bị lỗi!", error });
  }
});
// Xác nhận cuộc hẹn
router.put("/confirm/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment)
      return res.status(404).json({ message: "Không tìm thấy cuộc hẹn." });

    // ✅ Kiểm tra nếu volunteer là người xác nhận cuộc hẹn
    if (appointment.volunteerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền xác nhận cuộc hẹn này.",
      });
    }

    // ✅ Chỉ chuyển thành "confirmed" nếu trạng thái hiện tại là "pending"
    if (appointment.status !== "pending") {
      return res.status(400).json({
        message:
          "Chỉ có thể xác nhận cuộc hẹn khi đang ở trạng thái chờ xác nhận.",
      });
    }

    appointment.status = "confirmed";
    await appointment.save();

    res
      .status(200)
      .json({ message: "Xác nhận cuộc hẹn thành công.", appointment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xác nhận cuộc hẹn.", error });
  }
});
// Hủy cuộc hẹn với lý do hủy
router.put("/cancel/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const appointment = await Appointment.findById(id).populate([
      "elderlyId",
      "volunteerId",
    ]);
    if (!appointment)
      return res.status(404).json({ message: "Không tìm thấy cuộc hẹn." });

    appointment.status = "canceled";
    appointment.cancelReason = cancelReason || "Không rõ lý do";
    await appointment.save();

    await sendEmail({
      to: [appointment.elderlyId.email, appointment.volunteerId.email],
      subject: "Cuộc hẹn đã bị hủy",
      text: `Cuộc hẹn vào ngày ${appointment.date.toLocaleString()} đã bị hủy. Lý do: ${
        appointment.cancelReason
      }`,
    });

    res.status(200).json({ message: "Đã hủy cuộc hẹn.", appointment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi hủy cuộc hẹn.", error });
  }
});
// Lấy chi tiết cuộc hẹn
router.get("/detail/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate([
        { path: "elderlyId", select: "name avatar email" },
        { path: "volunteerId", select: "name avatar email" },
      ])
      .select("date status notes elderlyId volunteerId");

    if (!appointment)
      return res.status(404).json({ message: "Không tìm thấy cuộc hẹn." });

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết cuộc hẹn.", error });
  }
});
//Lọc theo ngày
router.get("/by-date", authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date)
      return res.status(400).json({ message: "Thiếu ngày cần tìm kiếm." });

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const appointments = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate([
        { path: "elderlyId", select: "name avatar email" },
        { path: "volunteerId", select: "name avatar email" },
      ])
      .select("date status notes elderlyId volunteerId");

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch theo ngày.", error });
  }
});

// Đánh giá cuộc hẹn
router.put("/rate/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Đánh giá phải từ 1 đến 5 sao." });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment)
      return res.status(404).json({ message: "Không tìm thấy cuộc hẹn." });

    // 🚀 Nếu đã đánh giá trước đó, không cho đánh giá lại!
    if (appointment.rating) {
      return res
        .status(400)
        .json({ message: "Bạn đã đánh giá cuộc hẹn này rồi!" });
    }

    if (appointment.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Chỉ có thể đánh giá sau khi hoàn thành." });
    }

    appointment.rating = rating;
    appointment.comment = comment || "";
    await appointment.save();

    res.status(200).json({ message: "Đánh giá thành công!", appointment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đánh giá.", error });
  }
});
router.get("/volunteers", authenticate, async (req, res) => {
  try {
    const volunteers = await User.find({ role: "volunteer" }).select(
      "_id name email avatar"
    );

    if (!volunteers.length) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tình nguyện viên nào." });
    }

    res.status(200).json(volunteers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách tình nguyện viên.", error });
  }
});
router.put("/complete/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment)
      return res.status(404).json({ message: "Không tìm thấy cuộc hẹn." });

    // ✅ Chỉ người cao tuổi mới có thể đánh dấu hoàn thành
    if (appointment.elderlyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền hoàn thành cuộc hẹn này.",
      });
    }

    // ✅ Chỉ chuyển thành "completed" nếu trạng thái hiện tại là "confirmed"
    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        message: "Chỉ có thể hoàn thành cuộc hẹn sau khi đã được xác nhận.",
      });
    }

    appointment.status = "completed";
    await appointment.save();

    res.status(200).json({ message: "Cuộc hẹn đã hoàn thành.", appointment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi hoàn thành cuộc hẹn.", error });
  }
});

module.exports = router;
