import FlightService from "../services/Flight.service.mjs";

import protect from "../middleware/protect.mjs";

import { Router } from "express";

const FlightRoute = Router();

FlightRoute.get("/search", FlightService.getFlightsBySearch);
FlightRoute.get("/:id", FlightService.getFlightById);

FlightRoute.use(protect);

FlightRoute.route("/")
  .get(FlightService.getAllFlights)
  .delete(FlightService.deleteFlight)
  .post(FlightService.addFlight);
FlightRoute.patch("/:id", FlightService.updateFlight);

export default FlightRoute;
