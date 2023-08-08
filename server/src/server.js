const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://127.0.0.1:5173",
    methods: ["GET", "POST"],
  },
});
let users = [];

io.on("connection", (socket) => {
  socket.on("login", (user) => {
    const has = users.find((single) => single.id == user.id);
    if (has) {
      users = users.map((single) =>
        single.id == has.id
          ? {
              ...single,
              is_online: true,
            }
          : single
      );
    } else {
      users.push({
        ...user,
        socket_id: socket.id,
        is_online: true,
      });
    }
    socket.broadcast.emit("login", users);
  });
  socket.on("disconnect", () => {
    users = users.map((user) =>
      user.socket_id == socket.id ? { ...user, is_online: false } : user
    );
    socket.broadcast.emit("login", users);
  });
  socket.on("message", (msg) => {
    io.emit("message", msg);
  });
});

app.get("/users", (req, res) => {
  res.json(users);
});

httpServer.listen(1993);
