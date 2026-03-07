import Game from "../models/Game.js";

export const saveGame = async (req, res) => {
    try {
        const { username, userColor, opponent, mode, result, pgn, movesCount } = req.body;
        const newGame = new Game({ username, userColor, opponent, mode, result, pgn, movesCount });
        await newGame.save();
        res.status(201).json({ success: true, game: newGame });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getGameHistory = async (req, res) => {
    try {
        const games = await Game.find({ username: req.params.username }).sort({ date: -1 }).limit(10);
        res.status(200).json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getGameById = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }
        res.status(200).json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
