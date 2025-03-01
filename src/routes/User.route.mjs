import { Router } from "express";
import UserService from "../services/User.service.mjs";
const protect = require("../middleware/protect");

const UserRoute = Router();

UserRoute.use(protect);
UserRoute.get("/users/:id", UserService.getUserById);

module.exports = UserRoute;
