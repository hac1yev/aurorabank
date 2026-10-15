import Grid from "@mui/material/Grid";
import { FormProvider, useForm } from "react-hook-form";
import { FormGrid } from "../../../components/mui/FormGrid";
import { RHFTextfield } from "../../../components/rhf/Textfield";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAddressDetailsSchema } from "../schema/AddressDetailSchema";
import { useAddressDetailsMutation } from "../../../mutations/addressDetails";
import type { ComponentStepProps } from "../types";

const AddressDetails: React.FC<ComponentStepProps> = ({
  handleNext,
  activeStep,
}) => {
  const addressDetailsSchema = createAddressDetailsSchema();
  const { mutate } = useAddressDetailsMutation();

  const userInfo = sessionStorage.getItem("userInfo");
  const parsedUserInfo = userInfo ? JSON.parse(userInfo) : {};

  const method = useForm({
    resolver: zodResolver(addressDetailsSchema),
    defaultValues: parsedUserInfo?.addressDetails
      ? parsedUserInfo.addressDetails
      : {
      country: "",
      city: "",
      address: "",
      postalCode: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, formState } = method;

  const onSubmit = (data: any) => {
    mutate(data, {
      onSuccess: () => {
        const userInfo = sessionStorage.getItem("userInfo");
        const parsedUserInfo = userInfo ? JSON.parse(userInfo) : {};
        const updatedUserInfo = {
          ...parsedUserInfo,
          addressDetails: data,
        };
        sessionStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
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
              name="address"
              placeholder="Enter address"
              label="Address"
            />
          </FormGrid>
          <FormGrid size={{ xs: 12, md: 6 }}>
            <RHFTextfield name="city" placeholder="Enter city" label="City" />
          </FormGrid>
          <FormGrid size={{ xs: 12, md: 6 }}>
            <RHFTextfield
              name="country"
              placeholder="Enter country"
              label="Country"
            />
          </FormGrid>
          <FormGrid size={{ xs: 12, md: 6 }}>
            <RHFTextfield
              name="postalCode"
              placeholder="Enter postal code"
              label="Postal Code"
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

export default AddressDetails;
