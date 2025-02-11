import FlightService from "../services/Flight.service.mjs";
import AuthGuard from "../guards/auth.gaurd.mjs";

import {Router} from "express";
import {ValidateAddFlightPayload, ValidateGetFlightById} from "../validators/Flight.validator.mjs";

const FlightRoute = Router();

FlightRoute.post("/flights", AuthGuard, ValidateAddFlightPayload, FlightService.addFlight);
FlightRoute.get("/flights", FlightService.getAllFlights);
FlightRoute.get("/flights/search", FlightService.getFlightsBySearch);
FlightRoute.get("/flights/:id", ValidateGetFlightById, FlightService.getFlightById);

export default FlightRoute;
