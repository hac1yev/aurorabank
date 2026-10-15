import z from "zod/v3";
import { PHONE_E164_REGEX } from "../../../consts";

export const createContactDetailSchema = () => {
  const defaultMessage = "This field is required";

  const phoneSchema = z.string().min(1, defaultMessage).regex(PHONE_E164_REGEX, {
    message: "Phone number is not correct",
  });

  const emailSchema = z
    .string()
    .min(1, defaultMessage)
    .email("Email address is not correct")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email address is not correct");

  return z.object({
    phone: phoneSchema,
    email: emailSchema,
  });
};
