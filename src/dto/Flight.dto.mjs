import {z} from "zod";

export const addFlightSchema = z.object({
  flightNumber: z.string().nonempty(),
  airline: z.string().nonempty(),
  departureCity: z.string().nonempty(),
  arrivalCity: z.string().nonempty(),
  schedule: z.object({
    departureTime: z.string().refine((value) => !isNaN(Date.parse(value)), "Invalid departure time format"),
    arrivalTime: z.string().refine((value) => !isNaN(Date.parse(value)), "Invalid arrival time format"),
  }),
  frequency: z.array(z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])).nonempty(),
  classes: z
    .array(
      z.object({
        classType: z.string().nonempty(),
        price: z.number().min(0),
        vacancy: z.number().min(0),
      })
    )
    .nonempty(),
  duration: z.string().nonempty(),
});
