const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer"); // Gửi email
const crypto = require("crypto"); // Tạo mã OTP
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");
let otpStore = {}; // Lưu mã OTP tạm thời

// Cấu hình Mailtrap
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});
// Cấu hình Multer để upload ảnh
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid = allowedTypes.test(file.mimetype);
    if (isValid) cb(null, true);
    else cb(new Error("❌ Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"));
  },
});
router.post(
  "/upload-avatar",
  authenticate,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Không có file được tải lên!" });

      const user = await User.findById(req.user._id); // 🔥 Đổi userId thành _id
      if (!user)
        return res.status(404).json({ error: "Người dùng không tồn tại!" });

      // 🗑️ Xóa avatar cũ nếu có
      if (user.avatar && user.avatar.startsWith("http")) {
        const oldFilePath = path.join(
          __dirname,
          "../uploads/",
          path.basename(user.avatar)
        );
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }

      // 🆕 Cập nhật avatar mới
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;
      user.avatar = imageUrl;
      await user.save();

      res.json({ message: "Cập nhật avatar thành công!", avatar: user.avatar });
    } catch (err) {
      console.error("❌ Lỗi khi upload avatar:", err);
      res.status(500).json({ error: "Lỗi khi upload avatar!" });
    }
  }
);
// ❌ API Xóa Avatar (Không chặn upload lại ảnh cũ)
router.delete("/remove-avatar", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id); // 🔥 Đổi userId thành _id
    if (!user)
      return res.status(404).json({ error: "Người dùng không tồn tại!" });

    // 🗑️ Xóa avatar cũ nếu tồn tại
    if (user.avatar && user.avatar.startsWith("http")) {
      const filePath = path.join(
        __dirname,
        "../uploads/",
        path.basename(user.avatar)
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // 🔥 Sử dụng avatar mặc định từ server
    user.avatar = `${req.protocol}://${req.get(
      "host"
    )}/uploads/default-avatar.png`;
    await user.save();

    res.json({ message: "Ảnh đại diện đã được xóa!", avatar: user.avatar });
  } catch (err) {
    console.error("❌ Lỗi khi xóa avatar:", err);
    res.status(500).json({ error: "Lỗi khi xóa avatar!" });
  }
});

// Chỉ admin mới có thể lấy danh sách user (có phân trang)
router.get("/", authenticate, authorizeRole("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("_id name email role avatar")
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    res.json({ totalUsers, page, limit, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API cập nhật thông tin cá nhân (Mở rộng thêm trường mới)
router.put("/update", authenticate, async (req, res) => {
  console.log("🔍 Full req.user:", req.user);
  console.log("🔑 User ID từ req.user:", req.user?._id);

  if (!req.user?._id) {
    return res
      .status(400)
      .json({ error: "User chưa xác thực hoặc token không hợp lệ!" });
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
  });
  if (!updatedUser) {
    return res
      .status(404)
      .json({ message: "Không tìm thấy user để cập nhật!" });
  }

  res.json({ message: "Cập nhật thành công!", user: updatedUser });
});

// Hàm kiểm tra mật khẩu mạnh (6-20 ký tự, có chữ hoa, số, ký tự đặc biệt)
const isStrongPassword = (password) => {
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,20}$/;
  return passwordRegex.test(password);
};
router.post("/register", async (req, res) => {
  try {
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
    const { name, email, password, role, avatar } = req.body;

    // Kiểm tra đầy đủ thông tin
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    // Kiểm tra email hợp lệ
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Email không hợp lệ" });
    }

    // Kiểm tra role hợp lệ
    const validRoles = ["elderly", "volunteer", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Role không hợp lệ" });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    // Kiểm tra độ mạnh mật khẩu
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "Mật khẩu phải có ít nhất 1 chữ hoa, 1 số, 1 ký tự đặc biệt và từ 6-20 ký tự",
      });
    }

    // Hash mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Nếu là "elderly", bỏ qua xác minh email
    const isVerified = role === "elderly";
    let verificationToken = null;
    let verificationLink = null;

    if (!isVerified) {
      verificationToken = crypto.randomBytes(32).toString("hex");
      verificationLink = `http://localhost:5000/users/verify/${verificationToken}`;
    }

    // Tạo người dùng mới
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      avatar: avatar || "", // nếu không có avatar thì để rỗng
      verificationToken,
      isVerified, // Elderly sẽ được xác minh ngay lập tức
    });

    // Lưu vào DB
    await newUser.save();

    // Nếu không phải elderly, gửi email xác minh
    if (!isVerified) {
      await transporter.sendMail({
        from: '"Hệ Thống" <no-reply@example.com>',
        to: email,
        subject: "Xác minh tài khoản",
        html: `<p>Xin chào ${name},</p>
               <p>Vui lòng nhấn vào <a href="${verificationLink}">đây</a> để xác minh tài khoản của bạn.</p>
               <p>Liên kết này có hiệu lực trong 24 giờ.</p>`,
      });

      return res.status(201).json({
        message:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.",
      });
    }

    // Nếu là elderly, phản hồi ngay lập tức
    res.status(201).json({
      message: "Đăng ký thành công! Bạn có thể đăng nhập ngay.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server: " + err.message });
  }
});

//Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không chính xác!" });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
});
// Quên mật khẩu - Gửi mã OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "Email không tồn tại" });

    const otp = crypto.randomInt(100000, 999999).toString(); // Tạo mã OTP 6 số
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // Hết hạn sau 5 phút

    // Gửi OTP qua email
    await transporter.sendMail({
      from: '"Hỗ trợ Elderly App" <no-reply@elderly-app.com>',
      to: email,
      subject: "Mã OTP đặt lại mật khẩu",
      text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`,
    });

    res.json({ message: "Mã OTP đã được gửi qua email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xác nhận OTP và đặt lại mật khẩu mới
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Kiểm tra đầy đủ thông tin
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    // Kiểm tra email hợp lệ
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Email không tồn tại" });
    }

    // Kiểm tra OTP còn hạn và khớp không
    const otpData = otpStore[email];
    if (!otpData || otpData.otp !== otp) {
      return res
        .status(400)
        .json({ error: "Mã OTP không đúng hoặc đã hết hạn" });
    }

    if (Date.now() > otpData.expiresAt) {
      delete otpStore[email]; // Xóa OTP đã hết hạn
      return res.status(400).json({ error: "Mã OTP đã hết hạn" });
    }

    // Kiểm tra mật khẩu mới có mạnh không
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error:
          "Mật khẩu phải có ít nhất 1 chữ hoa, 1 số, 1 ký tự đặc biệt và từ 6-20 ký tự",
      });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới cho user
    user.password = hashedPassword;
    await user.save();

    // Xóa OTP đã dùng
    delete otpStore[email];

    res.json({
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server: " + err.message });
  }
});
//Thay đổi mật khẩu
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });

    const isStrongPassword = (password) =>
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,20}$/.test(
        password
      );
    if (!isStrongPassword(newPassword))
      return res.status(400).json({ error: "Mật khẩu mới chưa đủ mạnh." });

    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ error: "Người dùng không tồn tại" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Mật khẩu cũ không chính xác" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await transporter.sendMail({
      from: '"Support" <support@example.com>',
      to: user.email,
      subject: "Thông báo đổi mật khẩu",
      text: "Bạn đã đổi mật khẩu thành công. Nếu không phải bạn, hãy liên hệ hỗ trợ ngay.",
    });

    res.json({
      message: "Đổi mật khẩu thành công! Một email thông báo đã được gửi.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Xác minh tài khoản qua email
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Kiểm tra token
    if (!token) {
      return res.status(400).json({ error: "Token không hợp lệ." });
    }

    // Tìm user theo token
    const user = await User.findOne({ verificationToken: token });

    // Không tìm thấy user
    if (!user) {
      return res
        .status(400)
        .json({ error: "Token xác minh không hợp lệ hoặc đã hết hạn." });
    }

    // Kiểm tra nếu đã xác minh rồi
    if (user.isVerified) {
      return res.status(200).json({
        message: "Tài khoản đã được xác minh trước đó. Vui lòng đăng nhập.",
      });
    }

    // Xác minh tài khoản
    user.isVerified = true;
    user.verificationToken = undefined; // Xóa token để tránh tái sử dụng
    await user.save();

    // Trả về kết quả
    res.status(200).json({
      message:
        "Xác minh tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ.",
    });

    // Hoặc nếu là website, có thể redirect:
    // return res.redirect('https://your-frontend-app.com/login?verified=true');
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau." });
  }
});
//API logout (cập nhật isOnline, lastOnline)
router.post("/logout", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ error: "Người dùng không tồn tại" });

    user.isOnline = false;
    user.lastOnline = new Date();
    await user.save();

    res.json({ message: "Đăng xuất thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//API gợi ý volunteer theo elderly
router.get("/recommend/:elderlyId", authenticate, async (req, res) => {
  try {
    const elderly = await User.findById(req.params.elderlyId);
    if (!elderly || elderly.role !== "elderly") {
      return res.status(404).json({ error: "Không tìm thấy người cao tuổi." });
    }

    const volunteers = await User.find({
      role: "volunteer",
      location: elderly.location,
      preferences: { $in: elderly.preferences },
      availability: true,
    }).select("name avatar skills experience rating");

    res.json({ volunteers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/me", authenticate, async (req, res) => {
  try {
    console.log("📌 Full req.user:", req.user);
    console.log("📌 User ID từ token:", req.user?._id); // Chỉnh sửa lại ở đây để sử dụng _id

    if (!req.user || !req.user._id) {
      // Kiểm tra lại _id thay vì userId
      console.log("❌ req.user không có _id!");
      return res.status(401).json({ error: "Không tìm thấy thông tin user." });
    }

    const user = await User.findById(req.user._id).select("-password"); // Sử dụng _id thay vì userId
    console.log("🔍 Kết quả tìm user từ DB:", user);

    if (!user) {
      console.log("❌ Không tìm thấy user trong database!");
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    res.json(user);
  } catch (err) {
    console.error("Lỗi Server:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});
module.exports = router;
