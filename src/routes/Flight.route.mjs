import FlightService from "../services/Flight.service.mjs";

import protect from "../middleware/protect.mjs";
import imageUpload from "../middleware/imageUpload.mjs";

import { Router } from "express";

const FlightRoute = Router();

FlightRoute.get("/search", FlightService.getFlightsBySearch);

FlightRoute.route("/").get(FlightService.getAllFlights);

FlightRoute.post("/showInterest/:id", protect, FlightService.showInterest);
FlightRoute.get(
  "/favoriteFlights",
  protect,
  FlightService.getMyFavoriteFlights
);

FlightRoute.get("/:id", FlightService.getFlightById);
FlightRoute.use(protect);
FlightRoute.route("/")
  .delete(FlightService.deleteFlight)
  .post(imageUpload("/flights").single("image"), FlightService.addFlight);
FlightRoute.patch(
  "/:id",
  imageUpload("/flights").single("image"),
  FlightService.updateFlight
);

export default FlightRoute;
