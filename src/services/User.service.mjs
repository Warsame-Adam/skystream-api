import UserModel from "../models/User.model.mjs";

// UTILS
import {comparePassword, hashPassword} from "../utils/bcrypt.utils.mjs";
import {generateJWT} from "../utils/jwt.utils.mjs";

// * SIGN UP
async function signUp(req, res) {
  try {
    const {name, email, password} = req.body;

    // CHECK IF EMAIL IS ALREADY REGISTERED
    const existingUser = await UserModel.findOne({email});
    if (existingUser) {
      return res.status(400).json({error: "EMAIL ALREADY EXISTS"});
    }

    // ENCRYPT THE PASSWORD
    const hashedPassword = await hashPassword(password);

    // CREATE AND SAVE NEW USER INSTANCE
    const query = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    let {password: _password, ...user} = query.toObject();

    // CREATE A JSON WEB TOKEN
    const token = generateJWT({_id: user._id});

    // SEND RESPONSE WITH USER AND TOKEN
    return res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error("ERROR CREATING USER:", error);
    return res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * SIGN IN
async function signIn(req, res) {
  try {
    const {email, password} = req.body;

    // CHECK IF EMAIL IS REGISTERED
    const userFound = await UserModel.findOne({email});
    if (!userFound) {
      return res.status(400).json({error: "INVALID CREDENTIALS"});
    }

    // ENCRYPT THE PASSWORD
    const isPasswordMatched = await comparePassword(password, userFound.password);

    if (!isPasswordMatched) {
      return res.status(400).json({error: "INVALID CREDENTIALS"});
    }

    // CREATE A JSON WEB TOKEN
    const token = generateJWT({_id: userFound._id});
    const {password: _, ...user} = userFound.toObject();

    // SEND RESPONSE WITH USER AND TOKEN
    return res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    console.error("ERROR SIGNING IN:", error);
    return res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * GET USER BY ID
async function getUserById(req, res) {
  try {
    const userId = req.params.id;

    // CHECK IF USER EXISTS
    const userFound = await UserModel.findById(userId).exec();
    if (!userFound) {
      return res.status(404).json({error: "USER NOT FOUND"});
    }
    const {password, ...userWithoutPassword} = userFound.toObject();

    // SEND RESPONSE WITH USER DATA
    res.status(200).json({
      ...userWithoutPassword,
    });
  } catch (error) {
    console.error("ERROR FETCHING USER:", error);
    res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

const UserService = {
  signUp,
  signIn,
  getUserById,
};

export default UserService;
