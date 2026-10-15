import { useMutation } from "@tanstack/react-query"
import { otpService } from "../services/otpService"

export const useVerifyOtpMutation = () => {
    return useMutation({
        mutationFn: async (otp: string) => otpService.verifyOtp(otp),
    })
}