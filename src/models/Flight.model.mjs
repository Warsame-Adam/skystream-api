import { Schema, model } from "mongoose";

const flightSchema = new Schema(
  {
    image: String,

    outboundAirline: {
      type: Schema.Types.ObjectId,
      ref: "Airline",
      required: [true, "Outbound Airline is Required"],
    },

    twoWay: {
      type: Boolean,
      default: true,
    },

    returnAirline: {
      type: Schema.Types.ObjectId,
      ref: "Airline",
    
      required: [
        function () {
          return this.twoWay; 
        },
        "Return Airline is Required",
      ],
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
            stopAtCity: {
              type: Schema.Types.ObjectId,
              ref: "Cities",
              required: [true, "Outbound Stop City is Required"],
            },
            stopAtAirport: {
              type: Schema.Types.ObjectId,
              ref: "Airport",
              required: [true, "Outbound Stop Airport Location is Required"],
            },
          },
        ],
      
        required: [
          function () {
        
            return this?.location?.outboundDirect === false;
          },
          "Stops are required if Outbound flight is not direct",
        ],
      },

      returnDirect: {
        type: Boolean,
        
        required: [
          function () {
            return this.twoWay;
          },
          "returnDirect is required if flight is twoWay",
        ],
      },

      returnStops: {
        type: [
          {
            stopAtCity: {
              type: Schema.Types.ObjectId,
              ref: "Cities",
              required: [true, "Return Stop City is Required"],
            },
            stopAtAirport: {
              type: Schema.Types.ObjectId,
              ref: "Airport",
              required: [true, "Return Stop Airport Location is Required"],
            },
          },
        ],
        required: [
          function () {
            
            return this.twoWay === true && this.location.returnDirect === false;
          },
          "Stops are required if Return flight is not direct",
        ],
      },

      departureCity: {
        type: Schema.Types.ObjectId,
        ref: "Cities",
        required: [true, "Departure city is required"],
      },
      departureAirport: {
        type: Schema.Types.ObjectId,
        ref: "Airport",
        required: [true, "Departure Airport name is required"],
      },
      arrivalCity: {
        type: Schema.Types.ObjectId,
        ref: "Cities",
        required: [true, "Arrival city is required"],
      },
      arrivalAirport: {
        type: Schema.Types.ObjectId,
        ref: "Airport",
        required: [true, "Arrival Airport name is required"],
      },
    },

    schedule: {
      departureTime: {
        type: Date,
        required: [true, "Departure time is required"],
        validate: {
          validator: function (value) {
            return !this.schedule.arrivalTime || value < this.schedule.arrivalTime;
          },
          message: "Departure time must be before arrival time",
        },
      },
      arrivalTime: {
        type: Date,
        required: [true, "Arrival time is required"],
      },
      returnDepartureTime: {
        type: Date,
        
        required: [
          function () {
            return this.twoWay;
          },
          "Return Departure time is required if twoWay is true",
        ],
        validate: {
          validator: function (value) {
            return (
              !this.schedule.returnArrivalTime ||
              value < this.schedule.returnArrivalTime
            );
          },
          message: "Return Departure time must be before Return Arrival time",
        },
      },
      returnArrivalTime: {
        type: Date,
        
        required: [
          function () {
            return this.twoWay;
          },
          "Return Arrival time is required if twoWay is true",
        ],
      },
    },

    frequency: {
      type: [String],
      required: [true, "Frequency is required"], 
    },

    classes: [
      {
        classType: {
          type: Schema.Types.ObjectId,
          ref: "FlightClassType",
          required: [true, "Class type is required"], 
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
    externalURL: {
      type: String,
      required: true,
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