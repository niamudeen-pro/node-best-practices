import { body, validationResult } from "express-validator";

const validateUser = (keepTheField = true) => [
  body("username")
    .if(() => keepTheField)
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .matches(/^[A-Za-z]+$/)
    .withMessage("Username should not contain numbers"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 3 })
    .withMessage("Password should be at least 3 characters long"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export { validateUser };
