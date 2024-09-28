import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { RESPONSE_CODE } from "../constants/index.js";

// functions related to the user password encoding and decoding

const encodePassword = async (password) => {
  if (!password) return;
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, encodedPassword) => {
  if (!password || !encodedPassword) return;

  return await bcrypt.compare(password, encodedPassword);
};

// functions related to the user token generation

const generateToken = (payload, time = process.env.JWT_EXPIRATION_TIME) => {
  if (!payload) return null;

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: time,
    });

    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    return null;
  }
};

const errorHandler = (error, req, res, next) => {
  return res
    .status(500)
    .json({ code: RESPONSE_CODE.SERVER_ERROR, error: error.message });
};

export { encodePassword, comparePassword, generateToken, errorHandler };
