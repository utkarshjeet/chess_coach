import express from "express";
import { saveGame, getGameHistory, getGameById } from "../controllers/gameController.js";

const router = express.Router();

router.post("/save", saveGame);
router.get("/history/:username", getGameHistory);
router.get("/history/game/:id", getGameById);

export default router;
