import { useMutation } from "@tanstack/react-query";
import { otpService } from "../services/otpService"

export const useResendOtpMutation = () => {
    return useMutation({
        mutationFn: async () => otpService.resendOtp(),
    })
}