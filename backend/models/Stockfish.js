 const mongoose = require("mongoose");

 const stockfishSchema = new mongoose.Schema({
    fen: { type: String, required: true },
    depth: { type: Number, required: true },
    mode: { type: String, required: true },
 });

 const Stockfish = mongoose.model("Stockfish", stockfishSchema);

 export default Stockfish;