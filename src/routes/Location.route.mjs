import LocationsService from "../services/Locations.service.mjs";

import protect from "../middleware/protect.mjs";

import { Router } from "express";

const LocationRoute = Router();

LocationRoute.get("/:id", LocationsService.getOne);

LocationRoute.use(protect);

LocationRoute.route("/")
  .get(LocationsService.getAll)
  .delete(LocationsService.deleteLocation)
  .post(LocationsService.createOne);
LocationRoute.patch("/:id", LocationsService.updateLocation);

export default LocationRoute;
