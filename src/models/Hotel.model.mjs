import { Schema, model } from "mongoose";
import validator from "validator";

const hotelSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
    },
    starRating: {
      type: Number, // 3, 4, or 5
      required: true,
    },
  
    cover: {
      type: String,
      required: [true, "Hotel Main Image is required"],
    },
    images: {
      type: [String], // Array of image URLs
      default: [],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    city: {
      type: Schema.Types.ObjectId,
      ref: "Cities",
      required: [true, "City is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
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
      cityCode: {
        type: String,
        required: true
      },
      countryCode: {
        type: String,
        required: true
      }
    },
    amenities: {
      wifi: {
        type: Boolean,
        default: false,
      },
      airCondition: {
        type: Boolean,
        default: false,
      },
      fitnessCenter: {
        type: Boolean,
        default: false,
      },
      deskSupport: {
        type: Boolean,
        default: false,
      },
      restaurant: {
        type: Boolean,
        default: false,
      },
      nonSmooking: {
        type: Boolean,
        default: false,
      },
      swimmingPool: {
        type: Boolean,
        default: false,
      },
      parking: {
        type: Boolean,
        default: false,
      },
    },
    contact: {
      phone: {
        type: String,
        required: [true, "Contact phone number is required"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Contact email is required"],
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, "Please Provide a Valid Email"],
      },
    },
    policies: {
      checkIn: {
        type: String,
        required: [true, "Check-in time is required"],
        match: /^([01]\d|2[0-3]):([0-5]\d)$/, // Ensures valid HH:mm format
      },
      checkOut: {
        type: String,
        required: [true, "Check-out time is required"],
        match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      },
      breakfastAvailable: {
        type: Boolean,
        default: true,
        required: [true, "Breakfast Included is required"],
      },
      petsAllowed: {
        type: Boolean,
        default: true,
        required: [true, "Pets allowed in Hotel is required"],
      },
      kidsAllowed: {
        type: Boolean,
        default: true,
        required: [true, "Children are welcome at this hotel is required"],
      },
    },
    otherImportantNotes: {
      type: String,
      trim: true,
    },
    reviews: {
      type: [
        {
          rating: {
            type: Number,
            min: 0,
            max: 5,
            required: [true, "Rating Star is Required"],
          },
          comment: {
            type: String,
            required: [true, "Rating Comment is Required"],
          },
          submittedBy: {
            type: String,
            required: [true, "Review Submitted By is Required"],
          },
          createdOn: {
            type: Date,
            default: Date.now(),
          },
        },
      ],
      default: [],
    },
    deals: {
      type: [
        {
          site: {
            type: String,
            required: [true, "Deal Source is required"],
          },
          siteLogo: {
            type: String,
            required: [true, "Deal Source Logo is required"],
          },
          rooms: [
            {
              type: {
                type: String,
                required: [true, "Room Type is required"],
              },
              pricePerNight: {
                type: Number,
                required: [true, "Price is required"],
              },
              noOfRooms: {
                type: Number,
                required: [true, "Number of Rooms is required"],
              },
              maxPersonAllowed: {
                type: Number,
                required: [
                  true,
                  "Maximum Number of Persons allowed is required",
                ],
              },
              maxAdults: {
                type: Number,
                required: [true, "Maximum number of adults is required"],
              },
              maxChildren: {
                type: Number,
                required: [true, "Maximum number of children is required"],
              },
              maxGuests: {
                type: Number,
                required: [true, "Maximum number of guests is required"],
              },
              freeCancellation: {
                type: Boolean,
                default: false,
                required: [true, "Free Cancellation Policy is required"],
              },
              breakfastIncluded: {
                type: Boolean,
                default: true,
                required: [true, "Breakfast Included is required"],
              },
              availableFrom: {
                type: Date,
                required: [true, "Available from time is required"],
              },
              availableTo: {
                type: Date,
                required: [true, "Available to time is required"],
              },
              bookingUrl: {
                type: String,
                required: [true, "Site Url of Deal is Required"],
              },
            },
          ],
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: "HOTELS", // Explicitly set the collection name
  }
);

hotelSchema.index({ location: "2dsphere" });

export default model("Hotel", hotelSchema);