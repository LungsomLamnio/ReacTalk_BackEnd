const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors");

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

io.on("connection", (socket) => {
  console.log("A user is connected via socket.io", socket.id);

  socket.on("sendMessage", (message) => {
    io.emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("root page");
});

server.listen(PORT, () => {
  console.log(`server running on port http://localhost:${PORT}`);
});
