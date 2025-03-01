import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.config.mjs";

// ROUTES
import authRoutes from "./routes/Auth.route.mjs";
import userRoutes from "./routes/User.route.mjs";
import hotelRoutes from "./routes/Hotel.route.mjs";
import flightRoutes from "./routes/Flight.route.mjs";
import locationRoutes from "./routes/Location.route.mjs";
import airlineRoutes from "./routes/Airline.route.mjs";
import classTypeRoutes from "./routes/ClassTypes.route.mjs";
import airportRoutes from "./routes/Airport.route.mjs";

dotenv.config();

const PORT = process.env.PORT;
const app = express();

// CONNECTING DATABSE
connectDB();

// MIDDLERWARE
app.use(express.json());

// REGISTER ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/airlines", airlineRoutes);
app.use("/api/airports", airportRoutes);
app.use("/api/flightsClasses", classTypeRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/hotels", hotelRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
