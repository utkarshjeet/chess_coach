import express from "express";
import { getMove, analyzeMove } from "../controllers/stockfishController.js";

const router = express.Router();

router.post("/get-move", getMove);
router.post("/analyze-move", analyzeMove);

export default router;