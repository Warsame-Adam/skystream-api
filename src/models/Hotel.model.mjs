import {Schema, model} from "mongoose";

const hotelSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    location: {
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
      },
      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
      },
    },
    amenities: {
      type: [String], // Array of strings
      default: [],
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
      },
    },
    policies: {
      checkIn: {
        type: String,
        required: [true, "Check-in time is required"],
      },
      checkOut: {
        type: String,
        required: [true, "Check-out time is required"],
      },
      cancellation: {
        type: String,
        required: [true, "Cancellation policy is required"],
      },
    },
    images: {
      type: [String], // Array of image URLs
      default: [],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: "HOTELS", // Explicitly set the collection name
  }
);

hotelSchema.index({location: "2dsphere"});

export default model("Hotel", hotelSchema);
