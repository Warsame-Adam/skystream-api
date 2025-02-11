import {Schema, model, Document} from "mongoose";

const flightSchema = new Schema(
  {
    airline: {
      type: String,
      required: [true, "Airline is required"],
      trim: true,
    },
    flightNumber: {
      type: String,
      required: [true, "Flight number is required"],
      unique: true,
      trim: true,
    },
    departureCity: {
      type: String,
      required: [true, "Departure city is required"],
      trim: true,
    },
    arrivalCity: {
      type: String,
      required: [true, "Arrival city is required"],
      trim: true,
    },
    schedule: {
      departureTime: {
        type: String,
        required: [true, "Departure time is required"],
      },
      arrivalTime: {
        type: String,
        required: [true, "Arrival time is required"],
      },
    },
    frequency: {
      type: [String],
      required: [true, "Frequency is required"], // Example: ["Monday", "Wednesday"]
    },
    classes: [
      {
        classType: {
          type: String,
          required: [true, "Class type is required"], // Example: "Economy"
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
        vacancy: {
          type: Number,
          required: [true, "Vacancy is required"],
          min: [0, "Vacancy cannot be negative"],
        },
      },
    ],
    duration: {
      type: String,
      required: [true, "Duration is required"], // Example: "2h 30m"
    },
    additionalInfo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "FLIGHTS",
  }
);

export default model("Flight", flightSchema);
