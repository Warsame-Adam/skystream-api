import { Router } from "express";
import UserService from "../services/User.service.mjs";
import protect from "../middleware/protect.mjs";

const AuthRouter = Router();

AuthRouter.post("/signup", UserService.signUp);
AuthRouter.post("/login", UserService.signIn);
AuthRouter.post("/externalLogin", UserService.externalLogin);

AuthRouter.use(protect);
AuthRouter.post("/validateToken", UserService.validateUser);

export default AuthRouter;
