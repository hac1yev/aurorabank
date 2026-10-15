import Grid from "@mui/material/Grid";
import dayjs from "dayjs";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonalDetailsSchema } from "../schema/PersonalDetailsSchema";
import type z from "zod/v3";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { usePersonalDetailsMutation } from "../../../mutations/personalDetails";
import { RHFTextfield } from "../../../components/rhf/Textfield";
import { RHFDatepicker } from "../../../components/rhf/Datepicker";
import { RHFCheckbox } from "../../../components/rhf/Consent";
import { FormGrid } from "../../../components/mui/FormGrid";
import type { ComponentStepProps } from "../types";

const PersonalDetails: React.FC<ComponentStepProps> = ({
  handleNext,
  activeStep,
}) => {
  const { mutate } = usePersonalDetailsMutation();

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

  const { handleSubmit, formState } = method;

  const onSubmit = (data: PersonalDetailsFormValues) => {
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
    });
  };

  return (
    <FormProvider {...method}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
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
            <Button type="submit" disabled={!formState.isValid}>
              Next
            </Button>
          </Stack>
        </Grid>
      </form>
    </FormProvider>
  );
};

export default PersonalDetails;
