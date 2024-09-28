import express from "express";
import { getUser } from "../controller/user.js";
import verifyToken from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.get("/", verifyToken, getUser);

export default userRouter;
