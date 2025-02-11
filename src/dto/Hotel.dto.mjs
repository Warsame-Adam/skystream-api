import {z} from "zod";

export const addHotelPayload = z.object({
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  address: z.string().nonempty(),
  city: z.string().nonempty(),
  location: z.object({
    latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
    longitude: z
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
  }),
  amenities: z.array(z.string()).optional(),
  contact: z.object({
    phone: z.string().nonempty(),
    email: z.string().email("Invalid email format"),
  }),
  policies: z.object({
    checkIn: z.string().nonempty(),
    checkOut: z.string().nonempty(),
    cancellation: z.string().nonempty(),
  }),
  images: z.array(z.string()).optional(),
});
