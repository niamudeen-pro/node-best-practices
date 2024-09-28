import jwt from "jsonwebtoken";
import { RESPONSE_CODE } from "../constants/index.js";

const verifyToken = (req, res, next) => {
  const token = req?.headers?.authorization?.split(" ")[1];

  if (!token) {
    return res.status(404).json({
      code: RESPONSE_CODE.INVALID_REQUEST,
    });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, function (error, result) {
    if (error) {
      return res.status(401).json({
        code: RESPONSE_CODE.TOKEN_EXPIRED,
      });
    }
    req.user = result;
    next();
  });
};

export default verifyToken;
