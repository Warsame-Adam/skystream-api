import AirportService from "../services/Airport.service.mjs";

import protect from "../middleware/protect.mjs";

import { Router } from "express";

const AirportRoute = Router();

AirportRoute.get("/:id", AirportService.getOne);

AirportRoute.use(protect);

AirportRoute.route("/")
  .get(AirportService.getAll)
  .delete(AirportService.deleteAirport)
  .post(AirportService.createOne);
AirportRoute.patch("/:id", AirportService.updateAirport);

export default AirportRoute;
