import ClassTypeService from "../services/ClassType.model.mjs";

import protect from "../middleware/protect.mjs";

import { Router } from "express";

const ClassTypeRoute = Router();

ClassTypeRoute.get("/:id", ClassTypeService.getOne);

ClassTypeRoute.route("/").get(ClassTypeService.getAll);

ClassTypeRoute.use(protect);
ClassTypeRoute.route("/")
  .delete(ClassTypeService.deleteClassType)
  .post(ClassTypeService.createOne);
ClassTypeRoute.patch("/:id", ClassTypeService.updateClassType);

export default ClassTypeRoute;
