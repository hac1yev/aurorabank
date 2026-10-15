import { useMutation } from "@tanstack/react-query";
import { identityVerificationService } from "../services/identityVerificationService";

export const useFaceRecognationMutation = () => {
  return useMutation({
    mutationFn: async (data: FormData) =>
      identityVerificationService.sendFaceRecognation(data),
  });
};
