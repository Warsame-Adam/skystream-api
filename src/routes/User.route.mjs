import { Router } from "express";
import UserService from "../services/User.service.mjs";
import protect from "../middleware/protect.mjs";

const UserRoute = Router();

UserRoute.use(protect);
UserRoute.get("/users/:id", UserService.getUserById);

export default UserRoute;
