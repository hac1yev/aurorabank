import Grid from "@mui/material/Grid";
import { FormProvider, useForm } from "react-hook-form";
import { FormGrid } from "../../../components/mui/FormGrid";
import { RHFTextfield } from "../../../components/rhf/Textfield";
import { createContactDetailSchema } from "../schema/ContactDetailSchema";
import type z from "zod/v3";
import { zodResolver } from "@hookform/resolvers/zod";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import type { ComponentStepProps } from "../types";
import { useContactDetails } from "../../../mutations/contactDetails";

const ContactDetails: React.FC<ComponentStepProps> = ({
  setIsOtpFlow,
  activeStep,
}) => {
  const contactDetailSchema = createContactDetailSchema();
  const { mutate } = useContactDetails();

  type ContactDetailFormValues = z.infer<typeof contactDetailSchema>;

  const userInfo = sessionStorage.getItem("userInfo");
  const parsedUserInfo = userInfo ? JSON.parse(userInfo) : {};

  const method = useForm<ContactDetailFormValues>({
    resolver: zodResolver(contactDetailSchema),
    defaultValues: parsedUserInfo?.contacts || {
      phone: "",
      email: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, formState } = method;

  const onSubmit = (data: ContactDetailFormValues) => {
    mutate(data, {
      onSuccess: () => {
        const userInfo = sessionStorage.getItem("userInfo");
        const parsedUserInfo = userInfo ? JSON.parse(userInfo) : {};
        const updatedUserInfo = {
          ...parsedUserInfo,
          contacts: data,
        };

        sessionStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
        sessionStorage.setItem("activeStep", String(Number(activeStep) + 1));
        setIsOtpFlow?.(true);
      },
    });
  };

  return (
    <FormProvider {...method}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <FormGrid size={{ xs: 12, md: 6 }}>
            <RHFTextfield
              name="phone"
              placeholder="Enter phone number"
              label="Phone Number"
            />
          </FormGrid>
          <FormGrid size={{ xs: 12, md: 6 }}>
            <RHFTextfield
              name="email"
              placeholder="Enter email"
              label="Email"
            />
          </FormGrid>
        </Grid>
        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 2, flex: 1, justifyContent: "space-between" }}
        >
          <Button type="button" variant="outlined">
            Back
          </Button>
          <Button type="submit" disabled={!formState.isValid}>
            Next
          </Button>
        </Stack>
      </form>
    </FormProvider>
  );
};

export default ContactDetails;
