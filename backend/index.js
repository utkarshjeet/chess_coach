import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import userRoutes from "./routes/authRoutes.js";
import stockfishRoutes from "./routes/stockfishRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", userRoutes);
app.use("/api/stockfish", stockfishRoutes);
app.use("/api/games", gameRoutes);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Error:", err);
  });


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send({ message: 'Hello ' });
});

app.get('/api', (req, res) => {
  res.send({ message: 'Hello from the backend!' });
});


export default app;




