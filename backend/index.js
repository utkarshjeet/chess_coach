import express from 'express';
import http from "http";
import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import userRoutes from "./routes/authRoutes.js";
import stockfishRoutes from "./routes/stockfishRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

const app = express();
const server = http.createServer(app);
const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: frontendURL,
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: frontendURL }));
app.use(express.json());
app.use("/api/auth", userRoutes);
app.use("/api/stockfish", stockfishRoutes);
app.use("/api/games", gameRoutes);

// Socket.io logic
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (username) => {
    onlineUsers.set(username, socket.id);
    console.log(`${username} is now online`);
  });

  socket.on('send-challenge', ({ from, to }) => {
    if (!to) {
      socket.broadcast.emit('new-challenge', { from, global: true });
    } else {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('new-challenge', { from });
      }
    }
  });

  socket.on('accept-challenge', ({ from, to }) => {
    const targetSocketId = onlineUsers.get(from);
    if (targetSocketId) {
      const gameId = `${from}-${to}-${Date.now()}`;
      const gameData = { gameId, players: { white: from, black: to } };

      io.to(targetSocketId).emit('game-started', gameData);
      socket.emit('game-started', gameData);
    }
  });

  socket.on('join-game', (gameId) => {
    socket.join(gameId);
    console.log(`Socket ${socket.id} joined game ${gameId}`);
  });

  socket.on('move', ({ gameId, move }) => {
    socket.to(gameId).emit('opponent-move', move);
  });

  socket.on('disconnect', () => {
    for (let [username, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(username);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Error:", err);
  });

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send({ message: 'Hello ' });
});

app.get('/api', (req, res) => {
  res.send({ message: 'Hello from the backend!' });
});

export default app;
