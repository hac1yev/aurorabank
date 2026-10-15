type VerificationSuccessProps = {
  handleContinue: () => void;
};

const VerificationSuccess = ({ handleContinue }: VerificationSuccessProps) => {
  return (
    <div className="verification-success">
      <div className="success-icon">✓</div>

      <h2>Identity Verified Successfully</h2>

      <p>
        Your face matches your passport photo. You can now continue with your
        registration.
      </p>

      <button onClick={handleContinue}>Continue</button>
    </div>
  );
};

export default VerificationSuccess;
