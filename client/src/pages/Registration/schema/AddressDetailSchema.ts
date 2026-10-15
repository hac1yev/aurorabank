import z from "zod/v3";

export const createAddressDetailsSchema = () => {
  const defaultMessage = "This field is required";

  const addressSchema = z
    .string()
    .min(1, defaultMessage)
    .max(85, "Address must be at most 85 characters long");

  const citySchema = z
    .string()
    .min(3, defaultMessage)
    .max(85, "City name must be at most 85 characters long");

  const countrySchema = z
    .string()
    .min(3, defaultMessage)
    .max(56, "Country name must be at most 56 characters long");

  const postalCodeSchema = z
    .string()
    .min(4, "Postal code must be 4 characters long")
    .max(4, "Postal code must be 4 characters long")
    .regex(/^\d{4}$/, "Postal code must be 4 digits");

  return z.object({
    country: countrySchema,
    city: citySchema,
    address: addressSchema,
    postalCode: postalCodeSchema,
  });
};
