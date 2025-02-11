import {Router} from "express";
import UserService from "../services/User.service.mjs";
import {ValidateSignIn, ValidateSignUp} from "../validators/User.validator.mjs";

const AuthRouter = Router();

AuthRouter.post("/auth/signup", ValidateSignUp, UserService.signUp);
AuthRouter.post("/auth/signin", ValidateSignIn, UserService.signIn);

export default AuthRouter;
