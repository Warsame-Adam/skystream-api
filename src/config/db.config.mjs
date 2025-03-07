import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import RolesService from "../services/Roles.service.mjs";
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in the .env file");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Database connected");
    const rolesRes = await RolesService.createDefaultRoles([
      "User",
      "Admin",
      "Super Admin",
    ]);
    if (rolesRes.error) {
      process.exit(1);
    }
    console.log("Default data success");
  } catch (error) {
    console.error("Error while connecting to DB:", error);
    process.exit(1);
  }
};

export default connectDB;
