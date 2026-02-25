import express from "express";
import { getBestMove } from "../services/stockfish.js";

const router = express.Router();

router.post("/get-move", async (req, res) => {
    try {
        const { fen, depth } = req.body;
        const result = await getBestMove(fen, depth);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/analyze-move", async (req, res) => {
    try {
        const { fenBefore, fenAfter, depth = 10 } = req.body;

        // Run two stockfish checks in parallel
        const [beforeResult, afterResult] = await Promise.all([
            getBestMove(fenBefore, depth),
            getBestMove(fenAfter, depth)
        ]);

        res.json({
            evalBefore: beforeResult.evaluation,
            evalAfter: afterResult.evaluation,
            bestMove: beforeResult.bestmove,
            mateBefore: beforeResult.mate,
            mateAfter: afterResult.mate
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;