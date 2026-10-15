import z from "zod/v3";
import { NAME_REGEX } from "../../../consts";
import dayjs, { Dayjs } from "dayjs";

export const createPersonalDetailsSchema = () => {
  const defaultMessage = "This field is required";

  const nameSchema = (label: string) => {
    return z
      .string()
      .min(1, { message: `${label} is required` || defaultMessage })
      .max(50, { message: `${label} must be at most 50 characters` })
      .regex(NAME_REGEX, {
        message: `${label} must contain only letters and spaces`,
      })
      .transform((value) => value.trim());
  };

  const birthDateSchema = z
    .custom<Dayjs>((value) => dayjs.isDayjs(value) && value.isValid(), {
      message: "Birth date is required",
    })
    .refine((value) => value.isAfter(dayjs("1900-01-01")), {
      message: "Birth date must be after 1900",
    })
    .refine((value) => value.isBefore(dayjs()), {
      message: "Birth date must be in the past",
    });

  const citizenshipSchema = z
    .string()
    .min(1, { message: "Citizenship is required" })
    .max(50, { message: "Citizenship must be at most 50 characters" })
    .regex(NAME_REGEX, {
      message: "Citizenship must contain only letters and spaces",
    })
    .transform((value) => value.trim());

  const passportNumberSchema = z
    .string()
    .min(1, { message: "Passport number is required" })
    .max(20, { message: "Passport number must be at most 20 characters" })
    .transform((value) => value.trim());

  const consentSchema = z
    .boolean()
    .refine((value) => value === true, {
      message: "You must agree to the terms and conditions",
    });

  return z.object({
    firstName: nameSchema("First name"),
    lastName: nameSchema("Last name"),
    birthDate: birthDateSchema,
    citizenship: citizenshipSchema,
    passportNumber: passportNumberSchema,
    consent: consentSchema,
  });
};
