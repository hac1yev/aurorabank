import { REGEXP_ONLY_DIGITS } from "input-otp";
import { PinInput } from "../../../components/base/input/pin-input";
import Button from "@mui/material/Button";
import { useVerifyOtpMutation } from "../../../mutations/verifyOtp";
import { useResendOtpMutation } from "../../../mutations/resendOtp";
import axios from "axios";
import { useEffect, useState } from "react";
import type { ComponentStepProps } from "../types";

const OtpVerification: React.FC<ComponentStepProps> = ({ handleNext, setIsOtpFlow }) => {
  const {
    mutate: verifyOtp,
    error: verifyOtpError,
  } = useVerifyOtpMutation();

  const { mutate: resendOtp, isPending: isResending } = useResendOtpMutation();

  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [remainingTime, setRemainingTime] = useState(180);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime((previousTime) => {
        if (previousTime <= 1) {
          setIsTimerRunning(false);
          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const handleComplete = (value: string) => {
    verifyOtp(value, {
      onSuccess: () => {
        setIsOtpFlow?.(false);
        handleNext?.();
      },
    });
  };

  const handleResendOtp = () => {
    resendOtp();

    setRemainingTime(180);
    setIsTimerRunning(true);
  };

  const errorMessage = axios.isAxiosError(verifyOtpError)
    ? verifyOtpError.response?.data?.message
    : undefined;

  return (
    <PinInput size="md">
      <PinInput.Label>
        Remaining time: {Math.floor(remainingTime / 60)}:
        {(remainingTime % 60).toString().padStart(2, "0")}
      </PinInput.Label>

      <PinInput.Label>Secure code</PinInput.Label>

      <PinInput.Group
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        onComplete={handleComplete}
      >
        {[...Array(6).map((_, index) => (
          <PinInput.Slot index={index} />
        ))]}
        <PinInput.Slot index={0} />
        <PinInput.Slot index={1} />
        <PinInput.Slot index={2} />
        <PinInput.Slot index={3} />
        <PinInput.Slot index={4} />
        <PinInput.Slot index={5} />
      </PinInput.Group>

      {errorMessage && <PinInput.Label>{errorMessage}</PinInput.Label>}

      <Button
        sx={{ flex: 1 }}
        variant="text"
        onClick={handleResendOtp}
        disabled={isResending || remainingTime > 0}
      >
        {isResending ? "Sending..." : "Resend Code"}
      </Button>
    </PinInput>
  );
};

export default OtpVerification;
