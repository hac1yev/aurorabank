import { useMutation } from "@tanstack/react-query";
import { personalDetailsService } from "../services/personalDetailsService";
import type { IPersonalDetails } from "../pages/Registration/types";

export const usePersonalDetailsMutation = () => {
  return useMutation({
    mutationFn: (personalDetails: IPersonalDetails) =>
      personalDetailsService.sendPersonalDetails(personalDetails),
  });
};
