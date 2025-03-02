import AirlinesService from "../services/Airlines.service.mjs";

import protect from "../middleware/protect.mjs";
import imageUpload from "../middleware/imageUpload.mjs";

import { Router } from "express";

const AirlinesRoute = Router();

AirlinesRoute.get("/:id", AirlinesService.getOne);

AirlinesRoute.use(protect);

AirlinesRoute.route("/")
  .get(AirlinesService.getAll)
  .delete(AirlinesService.deleteAirline)
  .post(imageUpload("/airlines").single("logo"), AirlinesService.createOne);
AirlinesRoute.patch(
  "/:id",
  imageUpload("/airlines").single("logo"),
  AirlinesService.updateAirline
);

export default AirlinesRoute;
