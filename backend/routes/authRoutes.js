import express from "express";
import { register, login, logout, getUser, updateProfile } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/user/:username", getUser);
router.put("/user/:username", updateProfile);

export default router;