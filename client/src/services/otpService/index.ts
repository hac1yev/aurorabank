import { RESEND_OTP_BASE_URL, VERIFY_OTP_BASE_URL } from "../baseUrls";
import { httpClient } from "../httpClient";

export const otpService = {
    verifyOtp: async (otp: string) => {
        const registrationToken = sessionStorage.getItem("registrationToken");

        return httpClient.post(`/registration/${VERIFY_OTP_BASE_URL}`, { otp }, {
            headers: {
                'x-registration-token': registrationToken
            }
        });
    },
    resendOtp: async () => {
        const registrationToken = sessionStorage.getItem("registrationToken");
        return httpClient.post(`/registration/${RESEND_OTP_BASE_URL}`, undefined, {
            headers: {
                'x-registration-token': registrationToken
            }
        });
    }
}