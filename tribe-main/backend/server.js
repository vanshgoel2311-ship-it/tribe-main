const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { chats } = require("./data");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const statusRoutes = require("./routes/statusRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Instance of Express Variable
const app = express();
dotenv.config();

connectDB();

app.use(cors());
app.use(express.json()); // To accept JSON data

app.get("/", (req, res) => {
  res.send("Running");
});

// User Routes
app.use("/api/user", userRoutes);

// Chat Routes
app.use("/api/chat", chatRoutes);

// Message Routes
app.use("/api/message", messageRoutes);

// Status Routes
app.use("/api/status", statusRoutes);

// Error Handling Middleware
app.use(notFound); // if url not found
app.use(errorHandler); // any other error

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server Started on Port ${PORT}`));
console.log("BACKEND RESTARTED WITH DEBUG LOGS");

// Socket.io
const io = require("socket.io")(server, {
  pingTimeout: 6000,
  cors: {
    origin: process.env.CLIENT_URL || "*",
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(" connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    onlineUsers.set(userData._id, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("user joind room :" + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) {
      return console.log("chat.user not defined");
    }

    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageReceived);
    });
  });

  socket.on("disconnect", () => {
    // Find user by socket.id and remove
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.off("setup", (userData) => {
    console.log("User Dissconnected");
    socket.leave(userData._id);
    onlineUsers.delete(userData._id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });
});
