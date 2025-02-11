import {Router} from "express";
import {ValidateGetUserById} from "../validators/User.validator.mjs";
import UserService from "../services/User.service.mjs";

const UserRouter = Router();

UserRouter.get("/users/:id", ValidateGetUserById, UserService.getUserById);

export default UserRouter;
