import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FormControl, FormHelperText } from '@mui/material';
import { sr } from 'date-fns/locale';

interface CustomDateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  views?: Array<'year' | 'month' | 'day' | 'hours' | 'minutes'>;
  format?: string;
  error?: string;
  fullWidth?: boolean;
}

export const CustomDateTimePicker = ({
  label,
  value,
  onChange,
  disabled = false,
  minDate,
  maxDate,
  views = ['hours', 'minutes'],
  format = "HH:mm",
  error,
  fullWidth = true
}: CustomDateTimePickerProps) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sr}>
      <FormControl fullWidth={fullWidth} error={!!error}>
        <MobileDateTimePicker
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          views={views}
          format={format}
          ampm={false}
          orientation="portrait"
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
              error: !!error
            },
            actionBar: {
              actions: ['clear', 'cancel', 'accept']
            },
            mobilePaper: {
              sx: {
                '& .MuiPickersLayout-contentWrapper': {
                  '& .MuiDateTimePickerTabs-root': {
                    display: 'none'  // Hide the tabs since we're using views prop
                  }
                }
              }
            }
          }}
        />
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    </LocalizationProvider>
  );
};
