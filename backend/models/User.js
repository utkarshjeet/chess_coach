import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    elo: { type: Number, default: 1200 },
    rapid: { type: Number, default: 1200 },
    blitz: { type: Number, default: 1200 },
    bullet: { type: Number, default: 1200 },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastGame: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    profilePicture: { type: String },
    bio: { type: String },
    location: { type: String },
    country: { type: String, default: "India" },

}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;