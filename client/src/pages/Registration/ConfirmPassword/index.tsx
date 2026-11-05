import { useEffect, useState } from "react";
import { Button, Grid, Stack, IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormGrid } from "../../../components/mui/FormGrid";
import { RHFTextfield } from "../../../components/rhf/Textfield";
import { createConfirmPasswordSchema } from "../schema/ConfirmPasswordSchema";
import type z from "zod/v3";
import { useConfirmPasswordMutation } from "../../../mutations/confirmPassword";
import { useNavigate } from "react-router-dom";

const ConfirmPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const { mutate } = useConfirmPasswordMutation();

  const confirmPasswordSchema = createConfirmPasswordSchema();
  type ConfirmPasswordFormValues = z.infer<typeof confirmPasswordSchema>;

  const method = useForm<ConfirmPasswordFormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(confirmPasswordSchema),
    mode: "onChange",
  });

  const { handleSubmit, formState, watch, trigger } = method;

  const password = watch("password");

  useEffect(() => {
    if (password) {
      void trigger("confirmPassword");
    }
  }, [password, trigger]);

  const onSubmit = (data: ConfirmPasswordFormValues) => {
    mutate(data, {
      onSuccess: (res) => {
        if(res.status) {
          sessionStorage.clear();
          navigate("/login");
        }
      }
    })
  };

  return (
    <FormProvider {...method}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <FormGrid size={{ xs: 12, md: 6 }}>
            <RHFTextfield
              name="password"
              placeholder="Create your password"
              label="Password"
              type={showPassword ? "text" : "password"}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </FormGrid>

          <FormGrid size={{ xs: 12, md: 6 }}>
            <RHFTextfield
              name="confirmPassword"
              placeholder="Confirm your password"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </FormGrid>

          <Stack
            direction="row"
            spacing={2}
            sx={{
              mt: 2,
              flex: 1,
              justifyContent: "space-between",
            }}
          >
            <Button type="button" variant="outlined">
              Back
            </Button>

            <Button type="submit" disabled={!formState.isValid}>
              Finish
            </Button>
          </Stack>
        </Grid>
      </form>
    </FormProvider>
  );
};

export default ConfirmPassword;
