import { Router } from "express";
import HotelService from "../services/Hotel.service.mjs";
import protect from "../middleware/protect.mjs";
import imageUpload from "../middleware/imageUpload.mjs";

const HotelRouter = Router();

HotelRouter.get("/search", HotelService.getHotelsBySearch);
HotelRouter.get("/:id", HotelService.getHotelById);

HotelRouter.route("/").get(HotelService.getAllHotels);

HotelRouter.use(protect);
HotelRouter.route("/")
  .delete(HotelService.deleteHotel)
  .post(
    imageUpload("/hotels").fields([
      { name: "cover", maxCount: 1 },
      { name: "images", maxCount: 5 },
    ]),
    HotelService.createHotel
  );

HotelRouter.patch(
  "/:id",
  imageUpload("/hotels").fields([
    { name: "cover", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  HotelService.updateHotel
);

export default HotelRouter;
