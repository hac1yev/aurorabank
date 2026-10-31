import z from "zod/v3";
import { PASSWORD_REGEX } from "../../../consts";

export const createConfirmPasswordSchema = () => {
  const defaultMessage = "This field is required";

  const password = z
    .string()
    .min(1, defaultMessage)
    .regex(
      PASSWORD_REGEX,
      "Password must be 8+ characters and include uppercase, lowercase, a number, and a special character.",
    );

  const confirmPassword = z.string().min(1, defaultMessage);

  return z
    .object({
      password,
      confirmPassword,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
};
