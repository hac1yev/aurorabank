import { FACE_RECOGNATION_BASE_URL, OCR_BASE_URL } from "../baseUrls";
import { httpClient } from "../httpClient";

export const identityVerificationService = {
  sendUploadedDocument: async (file: File) => {
    const registrationToken = sessionStorage.getItem("registrationToken");

    const formData = new FormData();
    formData.append("files", file);

    return httpClient.post(`/registration/${OCR_BASE_URL}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "x-registration-token": registrationToken,
      },
    });
  },
  sendFaceRecognation: async (data: FormData) => {
    const registrationToken = sessionStorage.getItem("registrationToken");

    return httpClient.post(`/registration/${FACE_RECOGNATION_BASE_URL}`, data, {
        headers: {
            "Content-Type": "multipart/form-data",
            "x-registration-token": registrationToken,
        }
    })
  },
};
