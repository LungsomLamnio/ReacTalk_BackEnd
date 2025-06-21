const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const cors = require("cors");
const socketIO = require("socket.io");
const http = require("http");
// const Message = require("./models/Message"); // ❌ remove this if not saving

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO setup
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ✅ Handle socket connection
io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("send-global-message", ({ sender, content }) => {
    console.log("🌍 Global message:", { sender, content });

    // Send message to all connected clients
    io.emit("receive-global-message", {
      sender,
      content,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
});

// ✅ Express middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// ✅ Connect DB and routes
connectDB();
app.use("/user", authRoutes);

app.get("/", (req, res) => {
  res.send("Home Page");
});

// ✅ Start server with socket support
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
