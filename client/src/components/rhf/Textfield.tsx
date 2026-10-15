import TextField, { type TextFieldProps } from "@mui/material/TextField";
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
} from "react-hook-form";

type Props<T extends FieldValues> = {
  name: Path<T>;
} & TextFieldProps;

export const RHFTextfield = <T extends FieldValues>({ name, ...props }: Props<T>) => {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField {...field} {...props} error={!!error} helperText={error?.message} />
      )}
    />
  );
};
