import { RESPONSE_CODE } from "../constants/index.js";
import User from "../models/user.js";
import {
  comparePassword,
  encodePassword,
  generateToken,
} from "../utils/helper.js";

/**
 * This function is used to create a new user.
 * @param {object} req => {username, email, password}
 * @returns {object} => {code}
 * */

const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ code: RESPONSE_CODE.INVALID_REQUEST });
    }

    const USER_EXISTS = await User.findOne({ email });

    if (USER_EXISTS) {
      return res.status(400).json({ code: RESPONSE_CODE.ALREADY_EXISTS });
    }

    await User.create({
      username,
      email,
      password: await encodePassword(password),
    });

    return res.status(200).json({ code: RESPONSE_CODE.SUCCESS });
  } catch (error) {
    next(error);
  }
};

/**
 * This function is used to login the user.
 * @param {object} req => { email, password}
 * @returns {object} => {code,user}
 * */

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: RESPONSE_CODE.INVALID_REQUEST });
    }

    const FOUND_USER = await User.findOne({ email });

    if (!FOUND_USER) {
      return res.status(400).json({ code: RESPONSE_CODE.NOT_FOUND });
    }

    const isPasswordMatch = await comparePassword(
      password,
      FOUND_USER.password
    );

    const payload = {
      userId: FOUND_USER._id.toString(),
    };

    if (isPasswordMatch) {
      return res.status(200).json({
        code: RESPONSE_CODE.SUCCESS,
        user: {
          username: FOUND_USER.username,
          email: FOUND_USER.email,
          _id: FOUND_USER._id.toString(),
        },
        token: generateToken(payload),
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * This function is used to refresh the access token.
 * @param {object} req => { userId }
 * @returns {object} => {code,token}
 * */

const refreshToken = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ code: RESPONSE_CODE.INVALID_REQUEST });
    }

    const timeExpiration = "60s";
    const payload = { userId };
    const token = generateToken(payload, timeExpiration);

    return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, token });
  } catch (error) {
    next(error);
  }
};

export { signup, login, refreshToken };
