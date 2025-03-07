import UserModel from "../models/User.model.mjs";
import RolesModel from "../models/roles.model.mjs";
import { generateJWT } from "../utils/jwt.utils.mjs";
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const createLoginToken = async (user, statusCode, req, res) => {
  const token = generateJWT({ id: user._id });

  const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN | 1;
  const cookieOptions = {
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    // secure: true,//only https
    httpOnly: true, //to prevent xss
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined; //not saving

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

// * SIGN UP
async function signUp(req, res) {
  try {
    const roleId = await RolesModel.findOne({ name: "User" });
    if (!roleId)
      return res
        .status(500)
        .json({ error: "Sorry! Application is not ready to register Users" });

    const { name, email, password } = req.body;

    // CREATE AND SAVE NEW USER INSTANCE
    const user = await UserModel.create({
      name,
      email,
      password,
      roles: [roleId._id],
    });
    if (!user) {
      return res.status(500).json({
        success: false,
        error: "There was an error in registering user, Try Again Later",
      });
    }

    createLoginToken(
      { ...user._doc, external: false, roles: [roleId.name] },
      200,
      req,
      res
    );
  } catch (error) {
    console.error("ERROR CREATING USER:", error);
    return res
      .status(500)
      .json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

// * SIGN IN
async function signIn(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Please Provide Email and password" });
    }

    const user = await UserModel.findOne({ email })
      .select("+password")
      .populate("roles");

    //Comparing password
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res
        .status(401)
        .json({ success: false, error: "Incorrect Email or password" });
    }

    createLoginToken(
      { ...user._doc, external: false, roles: user.roles.map((x) => x.name) },
      200,
      req,
      res
    );
  } catch (error) {
    console.error("ERROR SIGNING IN:", error);
    return res
      .status(500)
      .json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function externalLogin(req, res) {
  const { token, method } = req.body;
  let ticket = null;
  let name = undefined;
  let email = undefined;

  if (method === "google") {
    let tokenFromCode = await client.getToken(token);

    ticket = await client.verifyIdToken({
      idToken: tokenFromCode.tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    let u = ticket.getPayload();
    name = u.name;
    email = u.email;
  } else {
    return res
      .status(422)
      .json({ success: false, error: "Invalid data recieved from client" });
  }

  if (!name || !email)
    return next(new AppError("Invalid data recieved from client", 422));
  const user = await UserModel.findOne({ email })
    .select("+password")
    .populate("roles");

  if (user) {
    createLoginToken(
      { ...user._doc, external: true, roles: user.roles.map((x) => x.name) },
      200,
      req,
      res
    );
  } else {
    const roleId = await RolesModel.findOne({ name: "User" });
    if (!roleId)
      return res
        .status(500)
        .json({ error: "Sorry! Application is not ready to register Users" });

    // CREATE AND SAVE NEW USER INSTANCE
    const newUser = {
      name,
      email,
      roles: [roleId._id],
    };
    newUser = new UserModel(newUser);
    newUser = await newUser.save({ validateBeforeSave: false });
    if (!newUser) {
      return res.status(500).json({
        success: false,
        error: "There was an error in registering user, Try Again Later",
      });
    }
    createLoginToken(
      { ...newUser._doc, external: false, roles: [roleId.name] },
      200,
      req,
      res
    );
  }
}
async function validateUser(req, res) {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}
async function signUpAdmin() {
  let u = await UserModel.countDocuments({ email: process.env.email });
  if (u === 0) {
    const roleId = await RolesModel.findOne({ name: "Super Admin" });
    if (!roleId)
      return {
        error: true,
        status: 500,
        message: "Sorry! Application is not ready to register Userss",
      };

    let newUser = {
      name: process.env.name,
      email: process.env.email,
      password: process.env.password,
      roles: [roleId._id],
    };
    newUser = await UserModel.create(newUser);
    if (!newUser) {
      return {
        error: true,
        status: 500,
        message: "server unable to read this request",
      };
    }
  }

  return {
    error: false,
  };
}
// * GET USER BY ID
async function getUserById(req, res) {
  try {
    const userId = req.params.id;

    // CHECK IF USER EXISTS
    const userFound = await UserModel.findById(userId).exec();
    if (!userFound) {
      return res.status(404).json({ success: false, error: "USER NOT FOUND" });
    }

    // SEND RESPONSE WITH USER DATA
    res.status(200).json({
      success: true,
      data: {
        doc: userFound,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING USER:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

const UserService = {
  signUp,
  signIn,
  externalLogin,
  validateUser,
  signUpAdmin,
  getUserById,
};

export default UserService;
