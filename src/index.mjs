import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.config.mjs";

// ROUTES
import authRoutes from "./routes/Auth.route.mjs";
import userRoutes from "./routes/User.route.mjs";
import hotelRoutes from "./routes/Hotel.route.mjs";
import flightRoutes from "./routes/Flight.route.mjs";

dotenv.config();

const PORT = process.env.PORT;
const app = express();

// CONNECTING DATABSE
connectDB();

// MIDDLERWARE
app.use(express.json());

// REGISTER ROUTES
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", hotelRoutes);
app.use("/api", flightRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
