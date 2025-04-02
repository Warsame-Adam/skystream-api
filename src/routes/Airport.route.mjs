import AirportService from "../services/Airport.service.mjs";

import protect from "../middleware/protect.mjs";
import imageUpload from "../middleware/imageUpload.mjs";

import { Router } from "express";

const AirportRoute = Router();

AirportRoute.get("/:id", AirportService.getOne);

AirportRoute.route("/").get(AirportService.getAll);

AirportRoute.use(protect);
AirportRoute.route("/")
  .delete(AirportService.deleteAirport)
  .post(imageUpload.single("logo"), AirportService.createOne);
AirportRoute.patch(
  "/:id",
  imageUpload.single("logo"),
  AirportService.updateAirport
);

export default AirportRoute;
