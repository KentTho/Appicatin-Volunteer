const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware xác thực JWT
const authenticate = async (req, res, next) => {
  // Log toàn bộ headers để kiểm tra vấn đề
  console.log("🔍 Toàn bộ headers nhận được:", req.headers);

  const authHeader = req.headers.authorization;
  console.log("🔍 Header Authorization nhận được:", authHeader); // Log authHeader

  // Kiểm tra nếu không có header Authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc thiếu Bearer!" });
  }

  const token = authHeader.split(" ")[1]; // Lấy token sau "Bearer "
  console.log("🔍 Token nhận được:", token); // Log token

  try {
    // Giải mã token và kiểm tra hết hạn hoặc không hợp lệ
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔍 Decoded token:", decoded); // Log decoded token

    // Kiểm tra nếu token không chứa thông tin người dùng
    if (!decoded._id) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng trong token!" });
    }

    // Tìm người dùng từ ID
    const user = await User.findById(decoded._id).select("-password");
    console.log("🔍 Người dùng tìm thấy:", user); // Log user tìm được

    if (!user) {
      return res
        .status(404)
        .json({ message: `Không tìm thấy người dùng với ID ${decoded._id}` });
    }

    // Thêm thông tin người dùng vào request
    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    console.log("✅ Xác thực thành công! User:", req.user); // Log thông tin user
    next(); // Tiếp tục xử lý yêu cầu
  } catch (error) {
    console.error("❌ Lỗi xác thực token:", error);
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};
// Middleware kiểm tra quyền (role)
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra nếu người dùng không có quyền truy cập
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Quyền truy cập bị từ chối. Vai trò yêu cầu: ${roles.join(
          ", "
        )}`,
      });
    }
    next(); // Tiếp tục xử lý yêu cầu nếu quyền hợp lệ
  };
};

module.exports = { authenticate, authorizeRole };
