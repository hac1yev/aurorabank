import type { IConfirmPassword } from "../../pages/Registration/types";
import { CONFIRM_PASSWORD_BASE_URL } from "../baseUrls";
import { httpClient } from "../httpClient";

export const confirmPasswordService = {
  sendConfirmPassword: (data: IConfirmPassword) => {
    const registrationToken = sessionStorage.getItem("registrationToken");

    return httpClient.post(`/registration/${CONFIRM_PASSWORD_BASE_URL}`, data, {
      headers: {
        "x-registration-token": registrationToken,
      },
    });
  },
};
