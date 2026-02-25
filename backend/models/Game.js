import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
    username: { type: String, required: true },
    opponent: { type: String, required: true },
    mode: { type: String, required: true },
    result: { type: String, required: true },
    pgn: { type: String, required: true },
    movesCount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Game", gameSchema);
