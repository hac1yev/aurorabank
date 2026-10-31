import { useMutation } from "@tanstack/react-query";
import { confirmPasswordService } from "../services/confirmPasswordService";
import type { IConfirmPassword } from "../pages/Registration/types";

export const useConfirmPasswordMutation = () => {
  return useMutation({
    mutationFn: (data: IConfirmPassword) =>
      confirmPasswordService.sendConfirmPassword(data),
  });
};
