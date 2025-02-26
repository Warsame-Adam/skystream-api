import { Schema, model } from "mongoose";

const flightSchema = new Schema(
  {
    image: {
      type: String,
    },
    outboundAirline: {
      type: Schema.Types.ObjectId,
      ref: "FLIGHTS",
      required: [true, "Outbound Airline is Required"],
    },
    twoWay: {
      type: Boolean,
      default: true,
    },
    returnAirline: {
      type: Schema.Types.ObjectId,
      ref: "FLIGHTS",
      required: function () {
        return this.twoWay === true, "Return Airline is Required";
      },
    },
    flightNumber: {
      type: String,
      required: [true, "Flight number is required"],
      unique: true,
      trim: true,
    },
    location: {
      outboundDirect: {
        type: Boolean,
        default: true,
      },
      outboundStops: {
        type: [
          {
            stopAtCountry: {
              type: String,
              required: true, //country code
              trim: true,
            },
            stopAtCity: {
              type: String,
              required: true, //city code
              trim: true,
            },
            stopAtAirport: {
              type: String,
              required: true, //city code
              trim: true,
            },
          },
        ],
        required: function () {
          return (
            this.location.outboundDirect === false,
            "Stops are required if Outbound fligh is not direct"
          );
        },
      },
      returnDirect: {
        type: Boolean,
        required: function () {
          return (
            this.twoWay === true,
            "Flight will Return Directly(No Stop). Return Direct is Required"
          );
        },
      },
      returnStops: {
        type: [
          {
            stopAtCountry: {
              type: String,
              required: true, //country code
              trim: true,
            },
            stopAtCity: {
              type: String,
              required: true, //city code
              trim: true,
            },
            stopAtAirport: {
              type: String,
              required: true, //city code
              trim: true,
            },
          },
        ],
        required: function () {
          return (
            this.twoWay === true && this.location.returnDirect === false,
            "Stops are required if Return fligh is not direct"
          );
        },
      },
      departureCountry: {
        type: String,
        required: [true, "Departure Country is required"], //country code
        trim: true,
      },
      departureCity: {
        type: String,
        required: [true, "Departure city is required"], //city code
        trim: true,
      },
      departureAirport: {
        type: String,
        required: [true, "Departure City Airport name is required"], //city code
        trim: true,
      },
      arrivalCountry: {
        type: String,
        required: [true, "Arrival Country is required"], //country code
        trim: true,
      },
      arrivalCity: {
        type: String,
        required: [true, "Arrival city is required"],
        trim: true,
      },
      arrivalCityAirport: {
        type: String,
        required: [true, "Arrival City Airport name is required"], //city code
        trim: true,
      },
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
      returnDepartureTime: {
        type: String,
        required: function () {
          return this.twoWay === true, "Return Departure time is required";
        },
      },
      returnArrivalTime: {
        type: String,
        required: function () {
          return this.twoWay === true, "Return Arrival time is required";
        },
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
    selfTransfer: {
      type: Boolean,
      default: false,
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
