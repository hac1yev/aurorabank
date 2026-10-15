import { useMutation } from "@tanstack/react-query";
import type { IContactDetails } from "../pages/Registration/types";
import { contactDetailsService } from "../services/contactDetailsService";

export const useContactDetails = () => {
  return useMutation({
    mutationFn: (contactDetails: IContactDetails) =>
      contactDetailsService.sendContactDetails(contactDetails),
  });
};
