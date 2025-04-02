import {v2 as cloudinary} from "cloudinary"
import dotenv from "dotenv"
import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

console.log("🌐 cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("🔑 api key:", process.env.CLOUDINARY_API_KEY);
console.log("🔐 api secret:", process.env.CLOUDINARY_API_SECRET);


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})