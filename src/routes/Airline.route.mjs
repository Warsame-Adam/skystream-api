import AirlinesService from "../services/Airline.service.mjs";

import protect from "../middleware/protect.mjs";

import { Router } from "express";

const AirlinesRoute = Router();

AirlinesRoute.get("/:id", AirlinesService.getOne);

AirlinesRoute.use(protect);

AirlinesRoute.route("/")
  .get(AirlinesService.getAll)
  .delete(AirlinesService.deleteAirline)
  .post(AirlinesService.createOne);
AirlinesRoute.patch("/:id", AirlinesService.updateAirline);

export default AirlinesRoute;
