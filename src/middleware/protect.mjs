import { promisify } from "util";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.model.mjs";

//To Check whether user is login or not
export default async (req, res, next) => {
  try {
    //1 getting Token and check if there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "You are not logged in" });
    }
    //verifying Token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //checking User Really Exist
    const freshUser = await UserModel.findById(decoded.id)
      .select("+password")
      .populate("roles")
      .lean();

    if (!freshUser)
      return res.status(401).json({
        success: false,
        error: "The User Belonging to this Token does no longer Exist",
      });

    let finalUser = {
      ...freshUser,
      external: !freshUser.password,
      password: undefined,
      roles: freshUser.roles.map((x) => x.name),
    };

    req.user = finalUser;
    next(); //Allowing Access to
  } catch (error) {
    console.error("ERROR FETCHING USER:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
};
