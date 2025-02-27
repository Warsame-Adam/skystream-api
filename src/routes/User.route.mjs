import { Router } from "express";
import { ValidateGetUserById } from "../validators/User.validator.mjs";
import UserService from "../services/User.service.mjs";
const protect = require("../middleware/protect");

const router = express.Router();

router.post("/signup", UserService.signUp);
router.post("/login", UserService.signIn);

router.use(protect);
router.post("/validateToken", authController.validateUser);
UserRouter.get("/users/:id", ValidateGetUserById, UserService.getUserById);

module.exports = router;
