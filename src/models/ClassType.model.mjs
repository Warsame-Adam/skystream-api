import { Schema, model } from "mongoose";

const FlightClassTypeSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Economy", "Premium", "Business Class", "First Class"],
      required: [true, "Class Type is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "FLIGHTCLASSTYPES",
  }
);
export default model("FlightClassType", FlightClassTypeSchema);
