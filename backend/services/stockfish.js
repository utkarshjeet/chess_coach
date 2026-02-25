import axios from "axios";

export async function getBestMove(fen, level) {
    try {
        const depth = Math.max(5, Math.min(15, parseInt(level) || 10)); // stockfish.online v2.php requires depth >= 5. Cap at 15 for safety/speed.
        const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}`;
        const response = await axios.get(url);

        if (response.data.success) {
            const bestmoveText = response.data.bestmove;
            const moveStr = bestmoveText.split(" ")[1];

            let evalScore = response.data.evaluation;
            if (response.data.mate !== null) {
                evalScore = response.data.mate > 0 ? 100 - response.data.mate : -100 - response.data.mate;
            }

            return {
                bestmove: moveStr,
                evaluation: evalScore,
                mate: response.data.mate
            };
        } else {
            throw new Error(response.data.error || "Failed to fetch best move");
        }
    } catch (error) {
        console.error("Stockfish API Error:", error.message);
        throw error;
    }
}

export default getBestMove;