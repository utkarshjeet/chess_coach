import { useParams } from "react-router-dom";
import ChessBoard from "../components/ChessBoard";

function Game({ isHistory = false }) {

    const { mode, gameId } = useParams(); // bot / friend / coach / 10min  OR gameId for history

    return (
        <div style={{ backgroundColor: "#302e2b", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Arial, sans-serif" }}>
            <ChessBoard mode={mode} isHistory={isHistory} gameId={gameId} />
        </div>
    );
}

export default Game;