import { useMutation } from "@tanstack/react-query";
import { identityVerificationService } from "../services/identityVerificationService";

export const useUploadDocumentMutation = () => {
  return useMutation({
    mutationFn: async (file: File) =>
      identityVerificationService.sendUploadedDocument(file),
  });
};
