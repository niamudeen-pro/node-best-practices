import { RESPONSE_CODE } from "../constants/index.js";
import User from "../models/user.js";

/**
 * This function is used to get user details
 * @param {object} req => {userId}
 * @returns {object} => {code,user}
 * */

const getUser = async (req, res, next) => {
  try {
    const { userId } = req?.user;

    if (!userId) {
      return res.status(400).json({ code: RESPONSE_CODE.INVALID_REQUEST });
    }

    const FOUND_USER = await User.findOne({ _id: userId });

    if (FOUND_USER) {
      return res
        .status(200)
        .json({ code: RESPONSE_CODE.SUCCESS, user: FOUND_USER });
    }

    return res.status(400).json({ code: RESPONSE_CODE.NOT_FOUND });
  } catch (error) {
    next(error);
  }
};

export { getUser };
