import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface CustomTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  minTime?: Date;
  maxTime?: Date;
}

export const CustomTimePicker = ({
  label,
  value,
  onChange,
  disabled = false,
  minTime,
  maxTime
}: CustomTimePickerProps) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TimePicker
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        minTime={minTime}
        maxTime={maxTime}
        ampm={false}
        format="HH:mm"
        views={['hours', 'minutes']}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
            size: "small"
          },
          actionBar: {
            actions: ['clear', 'cancel', 'accept']
          }
        }}
      />
    </LocalizationProvider>
  );
};
