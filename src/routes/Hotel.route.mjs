import { Router } from "express";
import HotelService from "../services/Hotel.service.mjs";
import protect from "../middleware/protect.mjs";
import imageUpload from "../middleware/imageUpload.mjs";

const HotelRouter = Router();

HotelRouter.get("/search", HotelService.getHotelsBySearch);
HotelRouter.get("/getHotelsStats", HotelService.getHotelsStats);

HotelRouter.route("/").get(HotelService.getAllHotels);
HotelRouter.route("/getFabCityHotels").get(HotelService.getFabCityHotels);
HotelRouter.route("/recommendedHotels/:id").get(HotelService.getRelatedHotels);

HotelRouter.get("/:id", HotelService.getHotelById);

HotelRouter.use(protect);
HotelRouter.route("/")
  .delete(HotelService.deleteHotel)
  .post(
    imageUpload("/hotels").fields([
      { name: "cover", maxCount: 1 },
      { name: "images" },
    ]),
    HotelService.createHotel
  );

HotelRouter.post("/new-review/:hotelId", HotelService.addNewReview);
HotelRouter.post(
  "/new-deal-provider/:hotelId",
  HotelService.addNewDealProvider
);
HotelRouter.post("/new-deal/:hotelId/deals/:dealId", HotelService.addNewDeal);

HotelRouter.patch(
  "/:id",
  imageUpload("/hotels").fields([
    { name: "cover", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  HotelService.updateHotel
);

export default HotelRouter;
