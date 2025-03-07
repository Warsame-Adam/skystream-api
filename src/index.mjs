import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import cors from "cors";
import rateLimit from "express-rate-limit";
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

const PORT = process.env.PORT;
const app = express();

// CONNECTING DATABSE
connectDB();

//implementing CORS
//Access-control-Allow-Origin(Allowing Everyone to use our API)
app.use(cors());
app.options("*", cors());

// MIDDLERWARE
app.use(express.json());

//static File
//we need to change up how __dirname is used for ES6 purposes
const __dirname = path.dirname(fileURLToPath(import.meta.url));
//now please load my static html and css files for my express app, from my /public directory
app.use(express.static(path.join(__dirname, "public")));

//Allowing Only 100 Request in 1 Hour For '/api'
const limit = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: "Too Many Request From this IP.",
});
app.use("/api", limit);

// REGISTER ROUTES
//Routes Middleware
app.get("/api/test", (req, res) => {
  res.status(200).json({
    status: "Test Backend Success",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/airlines", airlineRoutes);
app.use("/api/airports", airportRoutes);
app.use("/api/flightsClasses", classTypeRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/hotels", hotelRoutes);

app.use(function (request, response, next) {
  if (process.env.NODE_ENV != "development" && !request.secure) {
    return response.redirect("https://" + request.headers.host + request.url);
  }

  next();
});

app.all("*", (req, res, next) => {
  next(
    new AppError(
      `requested Url ${req.originalUrl} could not be found on this server`,
      404
    )
  );
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
