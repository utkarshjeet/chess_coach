import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

const game = new Chess();


while (!game.isGameOver()) {
    const moves = game.moves()
    const move = moves[Math.floor(Math.random() * moves.length)]
    game.move(move)
}
console.log(game.pgn())



function ChessBoard() {
    return (
        <div style={{ width: "400px", margin: "auto", justifyContent: "center", alignItems: "center", display: "flex" }}>
            <Chessboard />
        </div>
    );
}


function ChessBoard1({ mode }) {

    if (mode === "bot") {
        // play with stockfish
    }

    if (mode === "friend") {
        // socket logic
    }

    if (mode === "coach") {
        // analysis logic
    }

    if (mode === "10min") {
        // analysis logic
    }

    return (
        <div>
            {/* chessboard UI */}
        </div>
    );
}

export default ChessBoard;
export { ChessBoard1 };