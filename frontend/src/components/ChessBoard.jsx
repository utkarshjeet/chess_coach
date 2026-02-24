import { useState, useRef, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

function TypeGame({ mode }) {
    // create a chess game using a ref to always have access to the latest game state within closures and maintain the game state across renders
    const chessGameRef = useRef(new Chess());
    const chessGame = chessGameRef.current;

    // track the current position of the chess game in state to trigger a re-render of the chessboard
    const [chessPosition, setChessPosition] = useState(chessGame.fen());
    const [moveFrom, setMoveFrom] = useState('');
    const [optionSquares, setOptionSquares] = useState({});

    // Game state tracking for UI
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStatus, setGameStatus] = useState("White to move");

    // Update game status whenever the position changes
    useEffect(() => {
        updateGameStatus();
    }, [chessPosition]);

    function updateGameStatus() {
        if (chessGame.isCheckmate()) {
            setGameStatus(`Checkmate! ${chessGame.turn() === 'w' ? 'Black' : 'White'} wins!`);
            setIsGameOver(true);
        } else if (chessGame.isDraw() || chessGame.isStalemate() || chessGame.isThreefoldRepetition() || chessGame.isInsufficientMaterial()) {
            setGameStatus("Game Over: Draw");
            setIsGameOver(true);
        } else if (chessGame.isCheck()) {
            setGameStatus(`Check! ${chessGame.turn() === 'w' ? 'White' : 'Black'} to move`);
            setIsGameOver(false);
        } else {
            setGameStatus(`${chessGame.turn() === 'w' ? 'White' : 'Black'} to move`);
            setIsGameOver(false);
        }
    }

    // make a random "CPU" move
    function makeRandomMove() {
        if (chessGame.isGameOver()) return;

        const possibleMoves = chessGame.moves();
        if (possibleMoves.length === 0) return;

        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        chessGame.move(randomMove);
        setChessPosition(chessGame.fen());
    }

    // get the move options for a square to show valid moves (with dot-style markers)
    function getMoveOptions(square) {
        // Enforce turns - can only see options for pieces of the current turn's color
        const pieceAtSquare = chessGame.get(square);
        if (!pieceAtSquare || pieceAtSquare.color !== chessGame.turn()) {
            return false;
        }

        const moves = chessGame.moves({
            square,
            verbose: true
        });

        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares = {};
        for (const move of moves) {
            const isCapture =
                chessGame.get(move.to) &&
                chessGame.get(move.to)?.color !== chessGame.get(square)?.color;

            // Small dot in center of target square, like chess.com
            newSquares[move.to] = {
                background: isCapture
                    ? 'radial-gradient(circle, rgba(0, 0, 0, 0.35) 70%, transparent 72%)'
                    : 'radial-gradient(circle, rgba(0, 0, 0, 0.25) 18%, transparent 20%)',
                borderRadius: '50%'
            };
        }

        // Highlight the selected square
        newSquares[square] = {
            boxShadow: 'inset 0 0 0 3px rgba(246, 219, 66, 0.9)',
        };

        setOptionSquares(newSquares);
        return true;
    }

    function onSquareClick(square, piece) {
        if (isGameOver) return; // Prevent clicking if game is over

        // Normalize argument defensively
        if (square && typeof square === 'object' && square.square) {
            square = square.square;
        }

        // Get piece explicitly if it isn't passed (v5 behavior onSquareClick only passes the square name)
        const pieceAtClick = chessGame.get(square);

        // Clicked own piece to start moving
        if (!moveFrom && pieceAtClick) {
            const hasMoveOptions = getMoveOptions(square);
            if (hasMoveOptions) setMoveFrom(square);
            return;
        }

        // Verify move is valid
        const moves = chessGame.moves({
            square: moveFrom,
            verbose: true
        });
        const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

        if (!foundMove) {
            const hasMoveOptions = getMoveOptions(square);
            setMoveFrom(hasMoveOptions ? square : '');
            return;
        }

        // Execute legal move
        try {
            chessGame.move({
                from: moveFrom,
                to: square,
                promotion: 'q'
            });
        } catch {
            const hasMoveOptions = getMoveOptions(square);
            if (hasMoveOptions) setMoveFrom(square);
            return;
        }

        // Successful click move
        setChessPosition(chessGame.fen());
        setMoveFrom('');
        setOptionSquares({});

        if (mode === "bot") {
            setTimeout(makeRandomMove, 300);
        }
    }

    function onPieceDrop(sourceSquare, targetSquare, piece) {
        if (isGameOver) return false;

        // Normalize argument defensively
        if (sourceSquare && typeof sourceSquare === 'object' && sourceSquare.sourceSquare) {
            piece = sourceSquare.piece;
            targetSquare = sourceSquare.targetSquare;
            sourceSquare = sourceSquare.sourceSquare;
        }

        if (!targetSquare) return false;

        // Enforce turns - can only drag pieces of the current turn's color
        const pieceObj = chessGame.get(sourceSquare);
        if (pieceObj && pieceObj.color !== chessGame.turn()) {
            return false;
        }

        try {
            chessGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });

            setChessPosition(chessGame.fen());
            setMoveFrom('');
            setOptionSquares({});

            if (mode === "bot") {
                setTimeout(makeRandomMove, 500);
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    const chessboardOptions = {
        onPieceDrop,
        onSquareClick,
        position: chessPosition,
        // use same key as official example so react-chessboard applies our dot styles
        squareStyles: optionSquares,
        id: 'click-or-drag-to-move',
        customDarkSquareStyle: { backgroundColor: "#779556" },
        customLightSquareStyle: { backgroundColor: "#ebecd0" }
    };

    return (
        <div style={{ width: "600px", margin: "auto", justifyContent: "center", alignItems: "center", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Game Status Banner */}
            <div style={{
                backgroundColor: isGameOver ? "#fa4621" : chessGame.isCheck() ? "#f59e0b" : "#262421",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "1.2rem",
                width: "100%",
                textAlign: "center",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                transition: "background-color 0.3s"
            }}>
                {gameStatus}
            </div>

            {/* Chessboard */}
            <Chessboard options={chessboardOptions} />

            {/* Restart Button if game over */}
            {isGameOver && (
                <button
                    onClick={() => {
                        chessGame.reset();
                        setChessPosition(chessGame.fen());
                        setIsGameOver(false);
                        setMoveFrom('');
                        setOptionSquares({});
                    }}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#81b64c",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: "1rem"
                    }}
                >
                    Play Again
                </button>
            )}
        </div>
    );
}

export default TypeGame;
