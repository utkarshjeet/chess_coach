const { spawn } = require("child_process");

const stockfish = spawn("stockfish");

module.exports = stockfish;