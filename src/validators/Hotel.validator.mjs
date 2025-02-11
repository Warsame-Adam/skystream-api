import {addHotelPayload} from "../dto/Hotel.dto.mjs";
import {z} from "zod";

export function ValidateHotelPayload(req, res, next) {
  try {
    addHotelPayload.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err);
      res.status(400).json({
        code: 400,
        message: errorMessages,
        timestamp: new Date(),
        path: req.originalUrl,
      });
      return;
    }
  }
}

// * GET HOTEL BY ID
export async function ValidateGetHotelById(req, res, next) {
  const {id} = req.params;
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (!isValidObjectId) {
    res.status(400).json({
      code: 400,
      message: ["ID parameter must be a valid MongoDB ObjectId"],
      timestamp: new Date(),
      path: req.originalUrl,
    });
    return;
  }
  next();
}
