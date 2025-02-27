import { Schema, model, Document } from "mongoose";

const airportSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Airport name is required"],
      trim: true,
    },
    logo: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"], // GeoJSON type must be "Point"
        required: true,
      },
      coordinates: {
        type: [Number], // Array of numbers: [longitude, latitude]
        required: true,
        validate: {
          validator: function (coords) {
            return coords.length === 2;
          },
          message:
            "Coordinates must have exactly two values: [longitude, latitude]",
        },
      },
    },
  },
  {
    timestamps: true,
    collection: "AIRPORTS",
  }
);
export default model("Airport", airportSchema);
