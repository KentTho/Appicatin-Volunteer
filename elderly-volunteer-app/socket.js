const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");

let io;
const onlineUsers = new Map(); // { userId: Set(socketIds) }

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:4200",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.emit("error", { message: "Lỗi xác thực: Cần có token" });
        return next(new Error("Lỗi xác thực: Cần có token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).lean();
      if (!user) {
        socket.emit("error", { message: "Không tìm thấy người dùng" });
        return next(new Error("Không tìm thấy người dùng"));
      }

      socket.user = { userId: user._id.toString(), role: user.role };
      next();
    } catch (err) {
      socket.emit("error", { message: "Lỗi xác thực: Token không hợp lệ" });
      next(err);
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User ${socket.user.userId} connected`);

    if (!onlineUsers.has(socket.user.userId)) {
      onlineUsers.set(socket.user.userId, new Set());
    }
    onlineUsers.get(socket.user.userId).add(socket.id);

    // Update user online status in DB
    User.findByIdAndUpdate(socket.user.userId, { isOnline: true })
      .exec()
      .catch((err) => console.error("❌ Error updating user status:", err));

    // Load unread messages when user connects
    const loadUnreadMessages = async () => {
      try {
        const unreadMessages = await Message.find({
          receiverId: socket.user.userId,
          isRead: false,
        }).lean();
        if (unreadMessages.length > 0) {
          socket.emit("unread_messages", unreadMessages);
        }
      } catch (error) {
        console.error("❌ Error loading unread messages:", error);
        socket.emit("error", { message: "Lỗi khi tải tin nhắn chưa đọc" });
      }
    };
    loadUnreadMessages();

    // Load message history for a conversation
    socket.on("load_messages", async (conversationId) => {
      try {
        const messages = await Message.find({ conversationId })
          .sort({ timestamp: 1 })
          .lean();
        socket.emit("messages_history", messages);
      } catch (error) {
        console.error("❌ Error loading messages:", error);
        socket.emit("error", { message: "Lỗi khi tải tin nhắn" });
      }
    });

    // Mark messages as read
    socket.on("read_messages", async (data) => {
      try {
        const { conversationId } = data;
        await Message.updateMany(
          { conversationId, receiverId: socket.user.userId, isRead: false },
          { $set: { isRead: true, seenAt: new Date() } }
        );
        io.emit("messages_read", { conversationId }); // Notify both sides
      } catch (error) {
        console.error("❌ Error marking messages as read:", error);
        socket.emit("error", { message: "Lỗi khi đánh dấu tin nhắn đã đọc" });
      }
    });

    // Handle socket disconnect
    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(socket.user.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(socket.user.userId);
          // Update user status when disconnected
          User.findByIdAndUpdate(socket.user.userId, {
            isOnline: false,
            lastOnline: new Date(),
          })
            .exec()
            .catch((err) =>
              console.error("❌ Error updating user status:", err)
            );
        }
      }
      console.log(`🔴 User ${socket.user.userId} disconnected`);
    });
  });

  return io;
}

module.exports = { initSocket, getIo: () => io, onlineUsers };
