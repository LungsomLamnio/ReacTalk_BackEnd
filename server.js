const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors");
const Message = require("./models/Message");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    withCredentials: true,
  },
});

const users = new Map();

io.on("connection", (socket) => {
  console.log("A user connected via socket.io", socket.id);

  socket.on("registerUser", (userId) => {
    users.set(userId, socket.id);
    console.log(`User registered: ${userId} with socket ${socket.id}`);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
    try {
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        content,
      });

      const savedMessage = await newMessage.save();

      await savedMessage.populate("sender", "username");
      await savedMessage.populate("receiver", "username");

      const messageData = {
        _id: savedMessage._id,
        senderId,
        receiverId,
        content,
        createdAt: savedMessage.createdAt,
        senderUsername: savedMessage.sender.username,
        receiverUsername: savedMessage.receiver.username,
      };

      const receiverSocketId = users.get(receiverId);
      const senderSocketId = users.get(senderId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", messageData);
      }

      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", messageData);
      }
    } catch (error) {
      console.error("Error saving message via socket:", error);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        break;
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("root page");
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
