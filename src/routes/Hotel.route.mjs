import {Router} from "express";
import {ValidateGetHotelById, ValidateHotelPayload} from "../validators/Hotel.validator.mjs";
import HotelService from "../services/Hotel.service.mjs";
import AuthGuard from "../guards/auth.gaurd.mjs";

const HotelRouter = Router();

HotelRouter.post("/hotels", AuthGuard, ValidateHotelPayload, HotelService.createHotel);
HotelRouter.get("/hotels", HotelService.getAllHotels);
HotelRouter.get("/hotels/search", HotelService.getHotelsBySearch);
HotelRouter.get("/hotels/:id", ValidateGetHotelById, HotelService.getHotelById);

export default HotelRouter;
