import LocationsService from "../services/Locations.service.mjs";

import protect from "../middleware/protect.mjs";
import imageUpload from "../middleware/imageUpload.mjs";

import { Router } from "express";

const LocationRoute = Router();

LocationRoute.get("/:id", LocationsService.getOne);

LocationRoute.route("/").get(LocationsService.getAll);

LocationRoute.use(protect);
LocationRoute.route("/").post(
  imageUpload("/locations").single("cover"),
  LocationsService.createOne
);

LocationRoute.route("/:id")
  .patch(
    imageUpload("/locations").single("cover"),
    LocationsService.updateLocation
  )
  .delete(LocationsService.deleteLocation);

export default LocationRoute;
