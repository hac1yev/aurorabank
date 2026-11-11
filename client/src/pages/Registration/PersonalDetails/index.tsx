import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import dayjs from "dayjs";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonalDetailsSchema } from "../schema/PersonalDetailsSchema";
import type z from "zod/v3";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import {
  usePersonalDetailsMutation,
  useUpdatePersonalDetailsMutation,
} from "../../../mutations/personalDetails";
import { RHFTextfield } from "../../../components/rhf/Textfield";
import { RHFDatepicker } from "../../../components/rhf/Datepicker";
import { RHFCheckbox } from "../../../components/rhf/Consent";
import { FormGrid } from "../../../components/mui/FormGrid";
import type { ComponentStepProps } from "../types";
import { getApiError } from "../../../utils/apiError";
import {
  clearReview,
  readReview,
  restartRegistration,
  toComparableValue,
} from "../../../utils/registrationSession";
import { formatCountdown, useCountdown } from "../hooks/useCountdown";

// Index of the identity verification step in consts.ts `steps`.
const IDENTITY_STEP = 3;

const PersonalDetails: React.FC<ComponentStepProps> = ({
  handleNext,
  activeStep,
  goToStep,
}) => {
  const {
    mutate,
    isPending,
    error: submitError,
  } = usePersonalDetailsMutation();
  const {
    mutate: updateDetails,
    isPending: isUpdatePending,
    error: updateError,
  } = useUpdatePersonalDetailsMutation();

  // Two paths only:
  //  - Returning from an OCR MISMATCH (a review is pending) -> PATCH, same token.
  //  - Any other submission is a first-time registration -> POST, new token.
  const [review] = useState(() => readReview());
  const isReturningFromMismatch = review !== null;

  const activeError = isReturningFromMismatch ? updateError : submitError;
  const isSubmitting = isReturningFromMismatch ? isUpdatePending : isPending;
  const apiError = getApiError(activeError);
  const isRateLimited =
    apiError.code === "PERSONAL_DETAILS_RATE_LIMITED" ||
    apiError.code === "PERSONAL_DETAILS_EDIT_RATE_LIMITED";
  const isSessionExpired = apiError.status === 404;
  const remainingSeconds = useCountdown(
    isRateLimited ? apiError.retryAfter : undefined,
    activeError,
  );

  const errorMessage = !activeError
    ? undefined
    : isRateLimited
      ? `${isReturningFromMismatch ? "Too many edits to your personal details" : "Too many registration attempts from your network"}. Try again in ${formatCountdown(remainingSeconds)}.`
      : isSessionExpired
        ? "Your registration session has expired. Please start again."
        : apiError.status === 400 && apiError.message
          ? apiError.message
          : "Something went wrong. Please try again.";

  const personalDetailsSchema = createPersonalDetailsSchema();
  type PersonalDetailsFormValues = z.infer<typeof personalDetailsSchema>;

  const userInfo = sessionStorage.getItem("userInfo");
  const parsedUserInfo = userInfo ? JSON.parse(userInfo) : {};

  const method = useForm<PersonalDetailsFormValues>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: parsedUserInfo?.personalDetails
      ? {
          ...parsedUserInfo.personalDetails,
          birthDate: dayjs(parsedUserInfo.personalDetails.birthDate),
        }
      : {
          firstName: "",
          lastName: "",
          birthDate: dayjs(null),
          citizenship: "",
          passportNumber: "",
          consent: false,
        },
    mode: "onChange",
  });

  const { handleSubmit, formState, setError } = method;

  // Highlight the fields that did not match the passport.
  useEffect(() => {
    review?.fields.forEach((field) => {
      setError(field as keyof PersonalDetailsFormValues, {
        type: "mismatch",
        message: "Does not match your passport",
      });
    });
  }, [review, setError]);

  const onSubmit = (data: PersonalDetailsFormValues) => {        
    if (isReturningFromMismatch) {
      if (review) {
        // Require a real correction, so the user cannot resubmit unchanged values to retry OCR.
        const unchangedFields = review.fields.filter(
          (field) =>
            toComparableValue(
              field,
              data[field as keyof PersonalDetailsFormValues],
            ) === review.snapshot[field],
        );

        if (unchangedFields.length > 0) {
          unchangedFields.forEach((field) =>
            setError(field as keyof PersonalDetailsFormValues, {
              type: "unchanged",
              message: "Change this field to match your passport",
            }),
          );
          return;
        }
      }
      updateDetails(data, {
        onSuccess: () => {
          // Merge so contacts and address already stored in this session are kept.
          const storedUserInfo = sessionStorage.getItem("userInfo");
          const parsedStoredUserInfo = storedUserInfo
            ? JSON.parse(storedUserInfo)
            : {};
          sessionStorage.setItem(
            "userInfo",
            JSON.stringify({
              ...parsedStoredUserInfo,
              personalDetails: data,
            }),
          );
          clearReview();
          goToStep?.(IDENTITY_STEP);
        },
      });
      return;
    }
    
    mutate(data, {
      onSuccess: (res) => {
        sessionStorage.setItem("registrationToken", res.data.registrationToken);
        sessionStorage.setItem(
          "userInfo",
          JSON.stringify({
            personalDetails: data,
          }),
        );
        sessionStorage.setItem("activeStep", String(Number(activeStep) + 1));
        handleNext?.();
      },
      onError: (error) => {
        console.error("Error submitting personal details:", error);
      }
    });
  };

  return (
    <FormProvider {...method}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {review && (
            <FormGrid size={{ xs: 12 }}>
              <Alert severity="warning">
                Some details do not match your passport. Correct the highlighted
                fields, then save to upload your passport again.
              </Alert>
            </FormGrid>
          )}
          {errorMessage && (
            <FormGrid size={{ xs: 12 }}>
              <Alert
                severity="error"
                action={
                  isSessionExpired ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() =>
                        restartRegistration({ keepPersonalDetails: true })
                      }
                    >
                      Start again
                    </Button>
                  ) : undefined
                }
              >
                {errorMessage}
              </Alert>
            </FormGrid>
          )}
          <FormGrid size={{ xs: 12, md: 6 }}>
            <RHFTextfield
              name="firstName"
              placeholder="Enter firstname"
              label="First name"
            />
          </FormGrid>
          <FormGrid size={{ xs: 12, md: 6 }}>
            <RHFTextfield
              name="lastName"
              placeholder="Enter lastname"
              label="Last name"
            />
          </FormGrid>
          <FormGrid size={{ xs: 6 }}>
            <RHFTextfield
              name="citizenship"
              placeholder="Enter your citizenship"
              label="Citizenship"
            />
          </FormGrid>
          <FormGrid size={{ xs: 6 }}>
            <RHFTextfield
              name="passportNumber"
              placeholder="Enter your passport number"
              label="Passport Number"
            />
          </FormGrid>
          <FormGrid size={{ xs: 6 }}>
            <RHFDatepicker name="birthDate" label="Birth Date" />
          </FormGrid>
          <FormGrid size={{ xs: 12 }}>
            <RHFCheckbox
              name="consent"
              label="I confirm that the information I have provided is accurate and complete, and I consent to its processing for the purpose of creating and managing my account."
            />
          </FormGrid>
          <Stack
            direction="row"
            spacing={2}
            sx={{ flex: 1, justifyContent: "flex-end" }}
          >
            <Button
              type="submit"
              disabled={
                !formState.isValid || isSubmitting || remainingSeconds > 0
              }
            >
              {isSubmitting
                ? isReturningFromMismatch
                  ? "Saving..."
                  : "Sending..."
                : isReturningFromMismatch
                  ? "Save and continue"
                  : "Next"}
            </Button>
          </Stack>
        </Grid>
      </form>
    </FormProvider>
  );
};

export default PersonalDetails;
