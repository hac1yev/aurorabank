import React from "react";
import { steps } from "../../../consts";

export const useStepperNavigation = () => {
  const [activeStep, setActiveStep] = React.useState(() => {
    const savedStep = sessionStorage.getItem("activeStep");
    return savedStep ? Number(savedStep) : 0;
  });
  
  const [completed, setCompleted] = React.useState<Record<number, boolean>>(() => {
      const savedStep = sessionStorage.getItem("activeStep");
      const activeStep = savedStep ? Number(savedStep) : 0;

      return Array.from({ length: activeStep }).reduce<Record<number, boolean>>(
        (acc, _, index) => {
          acc[index] = true;
          return acc;
        },
        {},
      );
    },
  );

  const totalSteps = steps.length;
  const completedSteps = Object.keys(completed).length;
  const isLastStep = activeStep === totalSteps - 1;
  const allStepsCompleted = completedSteps === totalSteps;

  const handleNext = () => {
    const newActiveStep =
      isLastStep && !allStepsCompleted
        ? steps.findIndex((_step, i) => !(i in completed))
        : activeStep + 1;
    setActiveStep(newActiveStep);
    setCompleted({
      ...completed,
      [activeStep]: true,
    });
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  return {
    activeStep,
    completed,
    totalSteps,
    completedSteps,
    isLastStep,
    allStepsCompleted,
    handleNext,
    handleBack,
    handleStep,
  };
};
