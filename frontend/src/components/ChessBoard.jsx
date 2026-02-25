import { useState, useRef, useEffect, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useNavigate } from "react-router-dom";

function TypeGame({ mode, isHistory = false, gameId = null }) {
    // create a chess game using a ref to always have access to the latest game state within closures and maintain the game state across renders
    const chessGameRef = useRef(new Chess());
    const chessGame = chessGameRef.current;

    // track the current position of the chess game in state to trigger a re-render of the chessboard
    const [chessPosition, setChessPosition] = useState(chessGame.fen());
    const [moveFrom, setMoveFrom] = useState('');
    const [optionSquares, setOptionSquares] = useState({});

    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStatus, setGameStatus] = useState("White to move");

    // Bot states
    const [isBotThinking, setIsBotThinking] = useState(false);
    const [botDepth, setBotDepth] = useState(10);
    const [playerColor, setPlayerColor] = useState(['bot', 'coach'].includes(mode) ? null : 'w');
    const [hint, setHint] = useState(null);
    const [isHintLoading, setIsHintLoading] = useState(false);

    const [currentEval, setCurrentEval] = useState(0.2);
    const [coachFeedback, setCoachFeedback] = useState(null);
    const [pendingBotMove, setPendingBotMove] = useState(null);
    const [pendingEval, setPendingEval] = useState(null);

    const [moveHistory, setMoveHistory] = useState([]);
    const [isGameSaved, setIsGameSaved] = useState(false);

    // History Analysis state
    const [loadedGameMoves, setLoadedGameMoves] = useState([]);  // stores verbose move objects
    const [historyViewIndex, setHistoryViewIndex] = useState(-1);
    const [analysisOpponent, setAnalysisOpponent] = useState("");

    const isViewingHistory = historyViewIndex < loadedGameMoves.length - 1;

    // Computed captured pieces based on current rendered chessPosition
    const captured = useMemo(() => {
        const temp = new Chess(chessPosition);
        const board = temp.board();
        const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 } };
        board.forEach(row => row.forEach(sq => {
            if (sq) counts[sq.color][sq.type]++;
        }));
        const start = { p: 8, n: 2, b: 2, r: 2, q: 1 };
        const caps = { w: [], b: [] };

        // Count missing pieces
        ['p', 'n', 'b', 'r', 'q'].forEach(type => {
            for (let i = 0; i < start[type] - counts.w[type]; i++) caps.w.push(type);
            for (let i = 0; i < start[type] - counts.b[type]; i++) caps.b.push(type);
        });

        const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
        let wScore = 0; let bScore = 0;
        caps.w.forEach(p => bScore += values[p]); // Black's score comes from White pieces lost
        caps.b.forEach(p => wScore += values[p]); // White's score comes from Black pieces lost

        return {
            whiteLost: caps.w,
            blackLost: caps.b,
            wAdvantage: wScore > bScore ? wScore - bScore : 0,
            bAdvantage: bScore > wScore ? bScore - wScore : 0
        };
    }, [chessPosition]);

    const pieceIcons = {
        w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕" },
        b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛" }
    };

    // Update game status whenever the position changes (only if playing)
    useEffect(() => {
        if (!isHistory) {
            updateGameStatus();
            setMoveHistory(chessGame.history());
            setHint(null);
        }
    }, [chessPosition, isHistory]); // Note: chessPosition changes when jumping history, so status triggers, but that's okay

    // Keep loadedGameMoves synced during live play
    useEffect(() => {
        if (!isHistory && !isViewingHistory) {
            const moves = chessGame.history({ verbose: true });
            setLoadedGameMoves(moves);
            setHistoryViewIndex(moves.length - 1);
        }
    }, [moveHistory, isHistory]);

    // Fetch the game if we are in History Mode
    useEffect(() => {
        if (isHistory && gameId) {
            fetch(`http://localhost:5000/api/games/history/game/${gameId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.pgn) {
                        chessGame.loadPgn(data.pgn);
                        const verboseMoves = chessGame.history({ verbose: true });
                        setLoadedGameMoves(verboseMoves);
                        setHistoryViewIndex(verboseMoves.length - 1);
                        setChessPosition(chessGame.fen());
                        setMoveHistory(chessGame.history());
                        setGameStatus(`Analysis Mode - Result: ${data.result}`);
                        setAnalysisOpponent(data.opponent);
                        setIsGameOver(true); // Disable play automatically in analysis
                    }
                })
                .catch(err => console.error("Error loading historical game:", err));
        }
    }, [isHistory, gameId]);

    function jumpToMove(index) {
        if (index < -1 || index >= loadedGameMoves.length) return;

        const tempGame = new Chess();
        for (let i = 0; i <= index; i++) {
            tempGame.move(loadedGameMoves[i]);
        }

        // Ensure the real chessGame state isn't overwritten during a live game
        if (isHistory) {
            chessGame.load(tempGame.fen());
        }
        setChessPosition(tempGame.fen());
        setHistoryViewIndex(index);
    }

    const saveGameToDB = async (finalResult) => {
        if (isGameSaved) return;
        const username = localStorage.getItem('username');
        if (!username) return;

        try {
            await fetch("http://localhost:5000/api/games/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    opponent: ['bot', 'coach'].includes(mode) ? `Computer (Level ${botDepth})` : mode,
                    mode,
                    result: finalResult,
                    pgn: chessGame.pgn(),
                    movesCount: Math.ceil(chessGame.history().length / 2)
                })
            });
            setIsGameSaved(true);
        } catch (e) {
            console.error("Failed to save game:", e);
        }
    };

    const startGame = (colorChoice) => {
        let chosen = colorChoice;
        if (chosen === 'random') {
            chosen = Math.random() > 0.5 ? 'w' : 'b';
        }
        setPlayerColor(chosen);
        setCurrentEval(0.2);
        if (chosen === 'b') {
            setTimeout(makeBotMove, 300);
        }
    };

    const getHint = async () => {
        if (isGameOver || isBotThinking || isHistory || isViewingHistory) return;
        setIsHintLoading(true);
        try {
            const response = await fetch("http://localhost:5000/api/stockfish/get-move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fen: chessGame.fen(), depth: 15 })
            });
            const data = await response.json();
            if (data.bestmove) setHint(data.bestmove);
        } catch (e) {
            console.error("Hint error", e);
        } finally {
            setIsHintLoading(false);
        }
    };

    const playHint = () => {
        if (!hint || isGameOver || isBotThinking) return;
        try {
            const moveObj = {
                from: hint.substring(0, 2),
                to: hint.substring(2, 4),
            };
            if (hint.length === 5) moveObj.promotion = hint.substring(4, 5);
            chessGame.move(moveObj);
            setChessPosition(chessGame.fen());
            setMoveFrom('');
            setOptionSquares({});
            if (['bot', 'coach'].includes(mode)) setTimeout(makeBotMove, 300);
        } catch (e) { }
    };

    function updateGameStatus() {
        if (chessGame.isCheckmate()) {
            setGameStatus(`Checkmate! ${chessGame.turn() === 'w' ? 'Black' : 'White'} wins!`);
            setIsGameOver(true);
            saveGameToDB(chessGame.turn() === 'w' ? 'Loss' : 'Win');
        } else if (chessGame.isDraw() || chessGame.isStalemate() || chessGame.isThreefoldRepetition() || chessGame.isInsufficientMaterial()) {
            setGameStatus("Game Over: Draw");
            setIsGameOver(true);
            saveGameToDB('Draw');
        } else if (chessGame.isCheck()) {
            setGameStatus(`Check! ${chessGame.turn() === 'w' ? 'White' : 'Black'} to move`);
            setIsGameOver(false);
        } else {
            setGameStatus(`${chessGame.turn() === 'w' ? 'White' : 'Black'} to move`);
            setIsGameOver(false);
        }
    }

    const coachingDictionary = {
        mistake: [
            "That's a Mistake. There was a much better move available.",
            "Inaccurate. You missed a better continuation.",
            "Careful! That move allows your opponent to equalize or gain an edge.",
            "Not the best idea. Let's see if you can spot the better move.",
            "That move is a bit suspicious. Try to find a stronger plan.",
            "You had better options there. Think about your piece activity."
        ],
        blunder: [
            "That's a Blunder! You gave up a significant advantage or material.",
            "Ouch! That's a major blunder. You just invited trouble.",
            "🚨 Terrible error! You're losing material or ruining your position.",
            "Whoops! You completely missed the opponent's threat.",
            "That's a fatal mistake. Can you see why?",
            "You just handed the advantage away with that one!"
        ]
    };

    const getRandomFeedback = (type) => {
        const messages = coachingDictionary[type];
        return messages[Math.floor(Math.random() * messages.length)];
    };

    async function makeBotMove() {
        if (chessGameRef.current.isGameOver()) return;

        setIsBotThinking(true);
        let analyzeDelta = null;
        let analyzeEval = null;

        // In coach mode, perform a full move analysis
        if (mode === 'coach') {
            const fenBefore = chessPosition;
            const fenAfter = chessGameRef.current.fen();
            try {
                const analyzeRes = await fetch("http://localhost:5000/api/stockfish/analyze-move", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fenBefore, fenAfter, depth: botDepth })
                });
                const analyzeData = await analyzeRes.json();
                analyzeEval = analyzeData.evalAfter;
                if (analyzeData.evalAfter !== undefined && analyzeData.evalBefore !== undefined) {
                    analyzeDelta = playerColor === 'w'
                        ? (analyzeData.evalAfter - analyzeData.evalBefore)
                        : (analyzeData.evalBefore - analyzeData.evalAfter);
                }
            } catch (e) {
                console.error("Analysis Failed:", e);
            }
        }
        try {
            const response = await fetch("http://localhost:5000/api/stockfish/get-move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fen: chessGameRef.current.fen(), depth: botDepth })
            });
            const data = await response.json();

            if (data.bestmove) {
                const moveStr = data.bestmove;
                // Convert UCI move (e.g. "e2e4" or "e7e8q") to an object that chess.js understands
                const moveObj = {
                    from: moveStr.substring(0, 2),
                    to: moveStr.substring(2, 4),
                };
                if (moveStr.length === 5) {
                    moveObj.promotion = moveStr.substring(4, 5);
                }

                if (mode === 'coach' && analyzeDelta !== null) {
                    if (analyzeDelta <= -2.0) {
                        setCoachFeedback({ type: 'blunder', message: getRandomFeedback('blunder'), delta: analyzeDelta });
                        setPendingBotMove(moveObj);
                        setPendingEval(analyzeEval);
                        setIsBotThinking(false);
                        return;
                    } else if (analyzeDelta <= -1.0) {
                        setCoachFeedback({ type: 'mistake', message: getRandomFeedback('mistake'), delta: analyzeDelta });
                        setPendingBotMove(moveObj);
                        setPendingEval(analyzeEval);
                        setIsBotThinking(false);
                        return;
                    }
                    if (analyzeEval !== null) setCurrentEval(analyzeEval);
                }

                chessGameRef.current.move(moveObj);
                setChessPosition(chessGameRef.current.fen());
            } else {
                console.error("No best move found", data);
                makeRandomMove(); // Fallback
            }
        } catch (error) {
            console.error("Error fetching bot move:", error);
            makeRandomMove(); // Fallback on error
        } finally {
            setIsBotThinking(false);
        }
    }

    // make a random "CPU" move fallback
    function makeRandomMove() {
        if (chessGameRef.current.isGameOver()) return;

        const possibleMoves = chessGameRef.current.moves();
        if (possibleMoves.length === 0) return;

        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        chessGameRef.current.move(randomMove);
        setChessPosition(chessGameRef.current.fen());
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
        if (isGameOver || isBotThinking || isHistory || isViewingHistory) return; // Prevent clicking if game is over or in history analysis

        // Normalize argument defensively
        if (square && typeof square === 'object' && square.square) {
            square = square.square;
        }

        // Get piece explicitly if it isn't passed (v5 behavior onSquareClick only passes the square name)
        const pieceAtClick = chessGame.get(square);

        // Clicked own piece to start moving
        if (!moveFrom && pieceAtClick) {
            if (['bot', 'coach'].includes(mode) && playerColor && pieceAtClick.color !== playerColor) return;
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

        if (['bot', 'coach'].includes(mode)) {
            setTimeout(makeBotMove, 300);
        }
    }

    function onPieceDrop(sourceSquare, targetSquare, piece) {
        if (isGameOver || isBotThinking || isHistory || isViewingHistory) return false;

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
        if (['bot', 'coach'].includes(mode) && playerColor && pieceObj.color !== playerColor) {
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

            if (['bot', 'coach'].includes(mode)) {
                setTimeout(makeBotMove, 500);
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    const navigate = useNavigate();

    const chessboardOptions = {
        onPieceDrop,
        onSquareClick,
        position: chessPosition,
        boardOrientation: playerColor === 'b' ? 'black' : 'white',
        // use same key as official example so react-chessboard applies our dot styles
        squareStyles: optionSquares,
        id: 'click-or-drag-to-move',
        customDarkSquareStyle: { backgroundColor: "#779556" },
        customLightSquareStyle: { backgroundColor: "#ebecd0" }
    };

    const resetGame = () => {
        chessGame.reset();
        setChessPosition(chessGame.fen());
        setIsGameOver(false);
        setMoveFrom('');
        setOptionSquares({});
        setIsGameSaved(false);
        setMoveHistory([]);
        setHint(null);
        setCoachFeedback(null);
        setPendingBotMove(null);
        setCurrentEval(0.2);
        if (['bot', 'coach'].includes(mode)) setPlayerColor(null);
    };

    const continueBotMove = () => {
        if (pendingBotMove) {
            if (pendingEval !== null) setCurrentEval(pendingEval);
            chessGameRef.current.move(pendingBotMove);
            setChessPosition(chessGameRef.current.fen());
            setCoachFeedback(null);
            setPendingBotMove(null);
            setOptionSquares({});
            setMoveFrom('');
        }
    };

    const undoUserMove = () => {
        chessGameRef.current.undo();
        setChessPosition(chessGameRef.current.fen());
        setCoachFeedback(null);
        setPendingBotMove(null);
        setOptionSquares({});
        setMoveFrom('');
    };

    let popupResult = "You Won!";
    let popupReason = "by checkmate";
    if (gameStatus === "Game Over: Draw") {
        popupResult = "Draw";
        popupReason = "by repetition/stalemate";
    } else if (gameStatus === "Resigned") {
        popupResult = "You Lost";
        popupReason = "by resignation";
    } else if (gameStatus.includes("Black wins!")) {
        popupResult = "You Lost";
        popupReason = "by checkmate";
    }

    return (
        <div style={{ display: "flex", gap: "20px", maxWidth: "1200px", margin: "auto", padding: "20px" }}>

            {/* Left Column: Board and Player plates */}
            <div style={{ display: "flex", flexDirection: "column", width: "600px" }}>

                {/* Top Player (Opponent) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", backgroundColor: "#555", borderRadius: "4px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            {isHistory ? "♟️" : "🤖"}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "bold" }}>
                                {isHistory ? analysisOpponent || "Opponent" : `Stockfish ${['bot', 'coach'].includes(mode) ? "(Bot)" : ""}`}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "auto", fontSize: "1.1rem", color: "#ccc" }}>
                                {(playerColor === 'b' ? captured.blackLost : captured.whiteLost).map((p, i) => <span key={i}>{pieceIcons[playerColor === 'b' ? 'b' : 'w'][p]}</span>)}
                                {(playerColor === 'b' ? captured.wAdvantage : captured.bAdvantage) > 0 && <span style={{ fontSize: "0.8rem", marginLeft: "4px" }}>+{(playerColor === 'b' ? captured.wAdvantage : captured.bAdvantage)}</span>}
                            </div>
                        </div>
                        {isBotThinking && !isHistory && <span style={{ color: "#81b64c", fontSize: "12px" }}>thinking...</span>}
                    </div>
                    <div style={{ backgroundColor: "#262421", padding: "8px 15px", borderRadius: "5px", fontFamily: "monospace", fontSize: "1.2rem", fontWeight: "bold" }}>
                        10:00
                    </div>
                </div>

                {/* Board Container with Relative Positioning for Overlay */}
                <div style={{ position: "relative", borderRadius: "4px", overflow: "hidden", backgroundColor: "#302e2b" }}>
                    <Chessboard options={chessboardOptions} />

                    {/* Coach Feedback Overlay */}
                    {coachFeedback && !isHistory && (
                        <div style={{
                            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.5)", zIndex: 12,
                            display: "flex", justifyContent: "center", alignItems: "center"
                        }}>
                            <div style={{
                                backgroundColor: "#262421", width: "340px", borderRadius: "10px",
                                overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.8)", border: `2px solid ${coachFeedback.type === 'blunder' ? '#fa4621' : '#e6912c'}`
                            }}>
                                <div style={{
                                    backgroundColor: coachFeedback.type === 'blunder' ? "#fa4621" : "#e6912c",
                                    padding: "15px", textAlign: "center", color: "white"
                                }}>
                                    <h2 style={{ margin: "0", fontSize: "1.4rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                        {coachFeedback.type === 'blunder' ? "🚨 Blunder!" : "⚠️ Mistake"}
                                    </h2>
                                </div>
                                <div style={{ padding: "20px", textAlign: "center", color: "#ccc" }}>
                                    <p style={{ margin: "0 0 15px 0", fontSize: "1.05rem", lineHeight: "1.4" }}>
                                        {coachFeedback.message}
                                    </p>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button onClick={undoUserMove} style={{ flex: 1, padding: "12px", backgroundColor: "#81b64c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>
                                            Try Again
                                        </button>
                                        <button onClick={continueBotMove} style={{ flex: 1, padding: "12px", backgroundColor: "transparent", color: "#ccc", border: "1px solid #555", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Game Over Popup Overlay */}
                    {isGameOver && !isHistory && (
                        <div style={{
                            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10,
                            display: "flex", justifyContent: "center", alignItems: "center"
                        }}>
                            <div style={{
                                backgroundColor: "#262421", width: "300px", borderRadius: "8px",
                                overflow: "hidden", boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
                            }}>
                                <div style={{
                                    backgroundColor: popupResult === "You Won!" ? "#81b64c" : (popupResult === "Draw" ? "#7fa650" : "#fa4621"),
                                    padding: "20px", textAlign: "center", color: "white"
                                }}>
                                    <h2 style={{ margin: "0 0 5px 0", fontSize: "1.5rem" }}>{popupResult}</h2>
                                    <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>{popupReason}</span>
                                </div>
                                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <button
                                        onClick={resetGame}
                                        style={{
                                            backgroundColor: "#81b64c", color: "white", padding: "12px",
                                            borderRadius: "6px", border: "none", cursor: "pointer",
                                            fontWeight: "bold", fontSize: "1rem"
                                        }}>
                                        Play Again
                                    </button>
                                    <button
                                        onClick={() => setIsGameOver(false)}
                                        style={{
                                            backgroundColor: "#3c3a38", color: "#ccc", padding: "12px",
                                            borderRadius: "6px", border: "none", cursor: "pointer",
                                            fontWeight: "bold"
                                        }}>
                                        Close (Analyze)
                                    </button>
                                    <button
                                        onClick={() => navigate("/dashboard")}
                                        style={{
                                            backgroundColor: "transparent", color: "#888", padding: "8px",
                                            border: "none", cursor: "pointer", textDecoration: "underline"
                                        }}>
                                        Go to Home
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Choose Color Overlay for Bot mode */}
                    {['bot', 'coach'].includes(mode) && playerColor === null && !isHistory && (
                        <div style={{
                            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.7)", zIndex: 10,
                            display: "flex", justifyContent: "center", alignItems: "center"
                        }}>
                            <div style={{
                                backgroundColor: "#262421", width: "320px", borderRadius: "8px",
                                padding: "20px", textAlign: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
                            }}>
                                <h3 style={{ color: "white", margin: "0 0 20px 0", fontSize: "1.3rem" }}>Choose your side</h3>
                                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                                    <button onClick={() => startGame('w')} style={{ flex: 1, padding: "12px", backgroundColor: "#fff", color: "#000", fontWeight: "bold", border: "none", borderRadius: "4px", cursor: "pointer" }}>White</button>
                                    <button onClick={() => startGame('random')} style={{ flex: 1, padding: "12px", backgroundColor: "#7fa650", color: "#fff", fontWeight: "bold", border: "none", borderRadius: "4px", cursor: "pointer" }}>?</button>
                                    <button onClick={() => startGame('b')} style={{ flex: 1, padding: "12px", backgroundColor: "#302e2b", color: "#fff", fontWeight: "bold", border: "1px solid #555", borderRadius: "4px", cursor: "pointer" }}>Black</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Player (You) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", backgroundColor: "#555", borderRadius: "4px", display: "flex", justifyContent: "center", alignItems: "center" }}>👤</div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "bold" }}>You</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "auto", fontSize: "1.1rem", color: "#ccc" }}>
                                {(playerColor === 'b' ? captured.whiteLost : captured.blackLost).map((p, i) => <span key={i}>{pieceIcons[playerColor === 'b' ? 'w' : 'b'][p]}</span>)}
                                {(playerColor === 'b' ? captured.bAdvantage : captured.wAdvantage) > 0 && <span style={{ fontSize: "0.8rem", marginLeft: "4px" }}>+{(playerColor === 'b' ? captured.bAdvantage : captured.wAdvantage)}</span>}
                            </div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: "#262421", padding: "8px 15px", borderRadius: "5px", fontFamily: "monospace", fontSize: "1.2rem", fontWeight: "bold" }}>
                        10:00
                    </div>
                </div>
            </div>

            {/* Right Column: Sidebar (Moves, Info, Controls) */}
            <div style={{ width: "350px", height: "680px", backgroundColor: "#262421", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Tabs Header */}
                <div style={{ display: "flex", backgroundColor: "#1e1e19" }}>
                    <div style={{ flex: 1, padding: "12px", textAlign: "center", backgroundColor: "#262421", color: "white", borderTop: "3px solid #81b64c", fontWeight: "bold", fontSize: "0.9rem" }}>
                        Play
                    </div>
                    <div style={{ flex: 1, padding: "12px", textAlign: "center", color: "#888", fontSize: "0.9rem", cursor: "pointer" }}>
                        New Game
                    </div>
                    <div style={{ flex: 1, padding: "12px", textAlign: "center", color: "#888", fontSize: "0.9rem", cursor: "pointer" }}>
                        Games
                    </div>
                </div>

                <div style={{ display: "flex", backgroundColor: "#262421", borderBottom: "1px solid #3c3a38" }}>
                    <div style={{ flex: 1, padding: "10px", textAlign: "center", color: "white", fontSize: "0.85rem", borderBottom: "2px solid white" }}>Moves</div>
                    <div style={{ flex: 1, padding: "10px", textAlign: "center", color: "#888", fontSize: "0.85rem" }}>Info</div>
                </div>

                {/* Move History Area */}
                <div style={{ flex: 1, overflowY: "auto", padding: "15px", display: "flex", flexDirection: "column" }}>
                    {moveHistory.length === 0 ? (
                        <div style={{ color: "#999", fontSize: "0.9rem", flex: 1 }}>
                            <p style={{ margin: 0, marginBottom: "10px" }}>Game starting position...</p>
                            <p style={{ margin: 0, opacity: 0.5, fontStyle: "italic" }}>Make a move to see the history.</p>
                        </div>
                    ) : (
                        <div style={{ flex: 1, color: "white", fontSize: "0.95rem" }}>
                            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, index) => {
                                const whiteMove = moveHistory[index * 2];
                                const blackMove = moveHistory[index * 2 + 1];
                                const isCurrentWhite = historyViewIndex === index * 2;
                                const isCurrentBlack = historyViewIndex === index * 2 + 1;

                                return (
                                    <div key={index} style={{ display: "flex", padding: "4px 0", backgroundColor: index % 2 === 0 ? "#2a2825" : "transparent" }}>
                                        <div style={{ width: "30px", color: "#888", textAlign: "right", paddingRight: "10px" }}>{index + 1}.</div>
                                        <div
                                            style={{ flex: 1, cursor: "pointer", color: isCurrentWhite ? "#81b64c" : "inherit" }}
                                            onClick={() => jumpToMove(index * 2)}
                                        >
                                            {whiteMove}
                                        </div>
                                        <div
                                            style={{ flex: 1, cursor: "pointer", color: isCurrentBlack ? "#81b64c" : "inherit" }}
                                            onClick={() => jumpToMove(index * 2 + 1)}
                                        >
                                            {blackMove || ""}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Difficulty Slider placed cleanly inside the sidebar info */}
                    {['bot', 'coach'].includes(mode) && (
                        <div style={{ marginTop: "auto", backgroundColor: "#1e1e19", padding: "15px", borderRadius: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "#ccc", marginBottom: "8px", fontSize: "0.9rem" }}>
                                <span>Bot Strength</span>
                                <span style={{ fontWeight: "bold", color: "white" }}>Level {botDepth}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={botDepth}
                                onChange={(e) => setBotDepth(parseInt(e.target.value))}
                                disabled={isBotThinking}
                                style={{ width: "100%", cursor: "pointer" }}
                            />
                        </div>
                    )}
                </div>

                {/* Controls Area (Bottom) */}
                <div style={{ padding: "15px", backgroundColor: "#1e1e19" }}>

                    {/* Move navigation buttons */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "2px", marginBottom: "15px", backgroundColor: "#262421", borderRadius: "6px", overflow: "hidden" }}>
                        <button
                            onClick={() => jumpToMove(-1)}
                            disabled={historyViewIndex === -1}
                            style={{ flex: 1, backgroundColor: "transparent", color: "#ccc", padding: "10px", border: "none", borderRight: "1px solid #3c3a38", cursor: "pointer", opacity: (historyViewIndex === -1) ? 0.5 : 1 }}
                        >⏮</button>
                        <button
                            onClick={() => jumpToMove(historyViewIndex - 1)}
                            disabled={historyViewIndex === -1}
                            style={{ flex: 1, backgroundColor: "transparent", color: "#ccc", padding: "10px", border: "none", borderRight: "1px solid #3c3a38", cursor: "pointer", opacity: (historyViewIndex === -1) ? 0.5 : 1 }}
                        >◀</button>
                        <button
                            onClick={() => jumpToMove(historyViewIndex + 1)}
                            disabled={historyViewIndex >= loadedGameMoves.length - 1}
                            style={{ flex: 1, backgroundColor: "transparent", color: "#ccc", padding: "10px", border: "none", borderRight: "1px solid #3c3a38", cursor: "pointer", opacity: (historyViewIndex >= loadedGameMoves.length - 1) ? 0.5 : 1 }}
                        >▶</button>
                        <button
                            onClick={() => jumpToMove(loadedGameMoves.length - 1)}
                            disabled={historyViewIndex >= loadedGameMoves.length - 1}
                            style={{ flex: 1, backgroundColor: "transparent", color: "#ccc", padding: "10px", border: "none", cursor: "pointer", opacity: (historyViewIndex >= loadedGameMoves.length - 1) ? 0.5 : 1 }}
                        >⏭</button>
                    </div>

                    {/* Hint section */}
                    {!isHistory && !isViewingHistory && ['bot', 'coach'].includes(mode) && playerColor !== null && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", backgroundColor: "#262421", padding: "10px", borderRadius: "6px" }}>
                            <button
                                onClick={getHint}
                                disabled={isHintLoading || isBotThinking || isGameOver}
                                style={{ backgroundColor: "#3c3a38", color: "white", padding: "8px 12px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                            >
                                {isHintLoading ? "Thinking..." : "💡 Get Hint"}
                            </button>
                            {hint && (
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                                    <span style={{ color: "#81b64c", fontWeight: "bold", fontFamily: "monospace", fontSize: "1.1rem" }}>{hint}</span>
                                    <button
                                        onClick={playHint}
                                        style={{ backgroundColor: "#81b64c", color: "white", padding: "8px 12px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginLeft: "auto" }}
                                    >
                                        Play It
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Game Action Buttons */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "15px" }}>
                            <button
                                onClick={() => { setIsGameOver(true); setGameStatus("Game Over: Draw"); saveGameToDB("Draw"); }}
                                style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem", fontWeight: "bold" }}
                                disabled={isGameOver || isHistory}
                                title={isHistory ? "Disabled in analysis" : "Offer Draw"}
                            >
                                <span style={{ fontSize: "1.2rem", fontWeight: "normal", opacity: isHistory ? 0.5 : 1 }}>½</span> <span style={{ opacity: isHistory ? 0.5 : 1 }}>Draw</span>
                            </button>
                            <button
                                onClick={() => { setIsGameOver(true); setGameStatus("Resigned"); saveGameToDB("Loss"); }}
                                style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem", fontWeight: "bold" }}
                                disabled={isGameOver || isHistory}
                                title={isHistory ? "Disabled in analysis" : "Resign"}
                            >
                                <span style={{ opacity: isHistory ? 0.5 : 1 }}>🏳️ Resign</span>
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={() => navigate("/dashboard")}
                                style={{ background: "none", border: "none", color: "#81b64c", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textDecoration: "underline" }}
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TypeGame;
