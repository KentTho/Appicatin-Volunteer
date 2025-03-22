require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const Message = require("./models/Message");
const User = require("./models/User");
const Conversation = require("./models/Conversation");
const Notification = require("./models/Notification"); // Model lưu thông báo
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);

// 🛠 Khởi tạo Socket.IO
const { initSocket, getIo, onlineUsers } = require("./socket");
const io = initSocket(server);

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔌 Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/elderlyDB")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// 🛣️ Định tuyến API
const userRoutes = require("./routes/users");
const appointmentRoutes = require("./routes/appoinment");
const messageRoutes = require("./routes/message");
const videoCallRoutes = require("./routes/videoCall");
const deleteRequestRoutes = require("./routes/deleteRequest");

app.use("/deleteRequest", deleteRequestRoutes);
app.use("/users", userRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/messages", messageRoutes);
app.use("/video-calls", videoCallRoutes);

// 🔍 Route lấy danh sách hội thoại
app.get("/conversations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversation.find({
      participants: userId,
    }).populate("lastMessage");
    res.json(conversations);
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    res.status(500).json({ error: "Error fetching conversations" });
  }
});

// 📡 Xử lý sự kiện Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token; // Điều chỉnh cách lấy token nếu cần
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error("Lỗi xác thực"));
    socket.user = user; // Gắn thông tin người dùng vào socket
    next();
  });
});

io.on("connection", (socket) => {
  if (!socket.user || !socket.user.userId) {
    console.error("❌ Lỗi: socket.user không tồn tại.");
    return;
  }

  console.log(`✅ User ${socket.user.userId} connected: ${socket.id}`);

  const loadUnreadMessages = async () => {
    const unreadMessages = await Message.find({
      receiverId: socket.user.userId,
      isRead: false,
    }).lean();
    if (unreadMessages.length > 0) {
      socket.emit("unread_messages", unreadMessages);
    }
  };
  loadUnreadMessages();

  socket.on("load_messages", async (conversationId) => {
    try {
      const messages = await Message.find({ conversationId })
        .sort({ timestamp: 1 })
        .lean();
      socket.emit("messages_history", messages);
    } catch (error) {
      socket.emit("error", { message: "Lỗi khi tải tin nhắn" });
    }
  });

  socket.on("read_messages", async (data) => {
    try {
      const { conversationId } = data;
      await Message.updateMany(
        { conversationId, receiverId: socket.user.userId, isRead: false },
        { $set: { isRead: true, seenAt: new Date() } }
      );
      io.emit("messages_read", { conversationId });
    } catch (error) {
      socket.emit("error", { message: "Lỗi khi đánh dấu tin nhắn đã đọc" });
    }
  });

  socket.on("disconnect", () => {
    if (!socket.user || !socket.user.userId) return;
    const userSockets = onlineUsers.get(socket.user.userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(socket.user.userId);
        User.findByIdAndUpdate(socket.user.userId, {
          isOnline: false,
          lastOnline: new Date(),
        })
          .exec()
          .catch((err) => console.error("❌ Error updating user status:", err));
      }
    }
    console.log(`🔴 ${socket.user.userId} disconnected.`);
  });
});

// 🛠 Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message || err);
  res.status(500).json({ error: "Something went wrong!" });
});

// 🚀 Chạy server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
