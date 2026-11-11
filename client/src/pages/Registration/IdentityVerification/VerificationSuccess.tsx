type VerificationSuccessProps = {
  isSuccess?: boolean;
  isError?: boolean;
  handleContinue?: () => void;
  handleRetake?: () => void;
  /** Optional overrides for failures that are not a face mismatch. */
  errorTitle?: string;
  errorMessage?: string;
  actionLabel?: string;
  handleAction?: () => void;
};

export const FaceVerificationResult = ({
  isSuccess,
  isError,
  handleContinue,
  handleRetake,
  errorTitle,
  errorMessage,
  actionLabel,
  handleAction,
}: VerificationSuccessProps) => {
  return (
    <>
      {isSuccess && (
        <div className="verification-success">
          <div className="success-icon">✓</div>

          <h2>Identity Verified Successfully</h2>

          <p>
            Your face matches your passport photo. You can now continue with
            your registration.
          </p>

          <button onClick={handleContinue}>Continue</button>
        </div>
      )}

      {isError && (
        <div className="verification-error">
          <div className="error-icon">✕</div>

          <h2>{errorTitle ?? "Identity Verification Failed"}</h2>

          <p>
            {errorMessage ??
              "Your face could not be matched with your passport photo. Please ensure good lighting, keep your face centered, and try again."}
          </p>

          <button onClick={handleAction ?? handleRetake}>
            {actionLabel ?? "Retake Selfie"}
          </button>
        </div>
      )}
    </>
  );
};
