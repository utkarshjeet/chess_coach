import { useParams } from "react-router-dom";
import ChessBoard from "../components/ChessBoard";

function Game() {

    const { mode } = useParams(); // bot / friend / coach / 10min

    return (
        <div>
            <h2>Mode: {mode}</h2>

            <ChessBoard mode={mode} />
        </div>
    );
}

export default Game;