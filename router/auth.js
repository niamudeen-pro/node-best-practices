import express from "express";
import { login, refreshToken, signup } from "../controller/auth.js";
import { validateUser } from "../middleware/validation.js";

const authRouter = express.Router();

authRouter.get("/refresh-token/:userId", refreshToken);

authRouter.post("/signup", validateUser(true), signup);

authRouter.post("/login", validateUser(false), login);

export default authRouter;
