import { Schema, model } from "mongoose";

const citiesSchema = new Schema(
  {
    cover: {
      type: String,
      required: [true, "Location Main Image is required"],
    },
    cityName: {
      type: String,
      required: [true, "City name is required"],
      trim: true,
    },
    cityCode: {
      type: String,
      required: [true, "City code is required"],
      trim: true,
      uppercase: true,
    },
    countryName: {
      type: String,
      required: [true, "Airline logo required"],
      trim: true,
    },
    countryCode: {
      type: String,
      required: [true, "Airline logo required"],
      trim: true,
      uppercase: true,
    },
    isFab: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "CITIES",
  }
);

// Create a unique compound index on cityCode and countryCode
citiesSchema.index({ cityCode: 1, countryCode: 1 }, { unique: true });

export default model("Cities", citiesSchema);
