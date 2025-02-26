import { Schema, model, Document } from "mongoose";

const airlineSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Airline is required"],
      trim: true,
    },
    logo: {
      type: String,
      required: [true, "Airline logo required"],
    },
  },
  {
    timestamps: true,
    collection: "AIRLINES",
  }
);
export default model("Airline", airlineSchema);
