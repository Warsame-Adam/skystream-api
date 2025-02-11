import {z} from "zod";

export const signUpPayload = z.object({
  name: z.string().nonempty(),
  email: z.string().email(),
  password: z.string().min(6),
});

export const signInPayload = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
