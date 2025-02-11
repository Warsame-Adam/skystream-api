import {z} from "zod";
import {signInPayload, signUpPayload} from "../dto/User.dto.mjs";

// * SIGN UP VALIDATOR
export async function ValidateSignUp(req, res, next) {
  try {
    signUpPayload.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err);
      res.status(400).json({
        code: 400,
        message: errorMessages,
        timestamp: new Date(),
        path: req.originalUrl,
      });
      return;
    }
  }
}

// * SIGN IN VALIDATOR
export async function ValidateSignIn(req, res, next) {
  try {
    signInPayload.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err);
      res.status(400).json({
        code: 400,
        message: errorMessages,
        timestamp: new Date(),
        path: req.originalUrl,
      });
      return;
    }
  }
}

// * SIGN IN VALIDATOR
export async function ValidateGetUserById(req, res, next) {
  const {id} = req.params;
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (!isValidObjectId) {
    res.status(400).json({
      code: 400,
      message: ["ID parameter must be a valid MongoDB ObjectId"],
      timestamp: new Date(),
      path: req.originalUrl,
    });
    return;
  }
  next();
}
