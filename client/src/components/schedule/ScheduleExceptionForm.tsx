import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { CreateScheduleExceptionData } from '../../services/scheduleService';
import { CustomDateTimePicker } from '../common/CustomDateTimePicker';
import { CustomTimePicker } from '../common/CustomTimePicker';

interface ScheduleExceptionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateScheduleExceptionData) => void;
  isLoading?: boolean;
  initialDate?: Date;
}

export function ScheduleExceptionForm({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  initialDate,
}: ScheduleExceptionFormProps) {
  const [date, setDate] = useState<Date | null>(initialDate || null);
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!date) {
      setError('Date is required');
      return false;
    }

    if (isWorkingDay) {
      if (!startTime || !endTime) {
        setError('Both start and end times are required for working days');
        return false;
      }

      if (startTime >= endTime) {
        setError('End time must be after start time');
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const exceptionData: CreateScheduleExceptionData = {
        date: format(date!, 'yyyy-MM-dd'),
        isWorkingDay,
        note: note || undefined,
      };

      if (isWorkingDay && startTime && endTime) {
        exceptionData.startTime = format(startTime, 'HH:mm');
        exceptionData.endTime = format(endTime, 'HH:mm');
      }

      onSubmit(exceptionData);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'relative',
          p: 2,
        },
      }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        Add Schedule Exception
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <CustomDateTimePicker
            label="Datum izuzetka"
            value={date}
            onChange={(newDate) => setDate(newDate)}
            disabled={isLoading}
            views={['year', 'month', 'day']}
            format="dd.MM.yyyy"
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={isWorkingDay}
              onChange={(e) => setIsWorkingDay(e.target.checked)}
              disabled={isLoading}
            />
          }
          label="Radni dan"
        />

        {isWorkingDay && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <CustomTimePicker
              label="Početak"
              value={startTime}
              onChange={(newTime) => setStartTime(newTime)}
              disabled={isLoading}
            />
            <CustomTimePicker
              label="Kraj"
              value={endTime}
              onChange={(newTime) => setEndTime(newTime)}
              disabled={isLoading}
            />
          </Box>
        )}

        <TextField
          margin="dense"
          label="Note"
          fullWidth
          multiline
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any notes about this schedule exception..."
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          Add Exception
        </Button>
      </DialogActions>
    </Dialog>
  );
}
