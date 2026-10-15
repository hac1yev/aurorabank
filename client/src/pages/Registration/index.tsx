import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useStepperNavigation } from "./hooks/useStepperNavigation";
import { steps } from "../../consts";
import OtpVerification from "./OtpVerification";

export const RegistrationStepper = () => {
  const [isOtpFlow, setIsOtpFlow] = React.useState(false);
  const { activeStep, completed, allStepsCompleted, handleStep, handleNext } =
    useStepperNavigation();

  const CurrentStepComponent = steps[activeStep].Component;

  const nextButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousActiveStepRef = React.useRef(activeStep);
  const previousCompletedRef = React.useRef(completed);

  React.useEffect(() => {
    const previousCompleted = previousCompletedRef.current;
    previousCompletedRef.current = completed;

    if (
      Object.keys(completed).length === 0 &&
      Object.keys(previousCompleted).length !== 0
    ) {
      nextButtonRef.current?.focus();
    }
  }, [completed, allStepsCompleted]);

  React.useEffect(() => {
    if (activeStep === 0 && previousActiveStepRef.current === 1) {
      nextButtonRef.current?.focus();
    }

    previousActiveStepRef.current = activeStep;
  }, [activeStep]);

  return (
    <Box sx={{ width: "100%", maxWidth: 960, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Account registration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Complete each step to open your account. You can jump between steps at
        any time.
      </Typography>

      {isOtpFlow ? (
        <OtpVerification handleNext={handleNext} setIsOtpFlow={setIsOtpFlow} />
      ) : (
        <>
          <Stepper nonLinear alternativeLabel activeStep={activeStep}>
            {steps.map((item, index) => (
              <Step key={item.label} completed={completed[index]}>
                <StepButton
                  aria-controls="stepper-content"
                  color="inherit"
                  onClick={handleStep(index)}
                >
                  {item.label}
                </StepButton>
              </Step>
            ))}
          </Stepper>

          <div id="stepper-content">
            {allStepsCompleted ? (
              <React.Fragment>
                <Paper variant="outlined" sx={{ mt: 3, p: 3 }}>
                  <Typography>
                    All steps completed — you&apos;re finished. Add your success
                    summary here.
                  </Typography>
                </Paper>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Paper variant="outlined" sx={{ mt: 3, p: 3, minHeight: 160 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {steps[activeStep].label}
                  </Typography>
                  {activeStep === 1 ? (
                    <CurrentStepComponent setIsOtpFlow={setIsOtpFlow} activeStep={activeStep} />
                  ) : (
                    <CurrentStepComponent handleNext={handleNext} activeStep={activeStep} />
                  )}
                </Paper>
              </React.Fragment>
            )}
          </div>
        </>
      )}
    </Box>
  );
};
