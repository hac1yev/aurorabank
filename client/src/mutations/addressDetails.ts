import { useMutation } from "@tanstack/react-query";
import type { IAddressDetails } from "../pages/Registration/types";
import { addressDetailsService } from "../services/addressDetailsService";

export const useAddressDetailsMutation = () => {
  return useMutation({
    mutationFn: async (addressDetails: IAddressDetails) =>
      addressDetailsService.sendAddressDetails(addressDetails),
  });
};
