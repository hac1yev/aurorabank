import Checkbox from "@mui/material/Checkbox";
import FormControlLabel, { type FormControlLabelProps } from "@mui/material/FormControlLabel";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";

type Props<T extends FieldValues> = {
  name: Path<T>;
} & Omit<FormControlLabelProps, "control">;

export const RHFCheckbox = <T extends FieldValues>({ name, ...props }: Props<T>) => {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          {...props}
          control={
            <Checkbox
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
            />
          }
        />
      )}
    />
  );
};
