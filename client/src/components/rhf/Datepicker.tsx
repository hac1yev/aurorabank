import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, type DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";

type Props<T extends FieldValues> = {
  name: Path<T>;
} & DatePickerProps;

export const RHFDatepicker = <T extends FieldValues>({ name, ...props }: Props<T>) => {
  const { control } = useFormContext<T>();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <DatePicker
            {...field}
            {...props}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </LocalizationProvider>
  );
};
