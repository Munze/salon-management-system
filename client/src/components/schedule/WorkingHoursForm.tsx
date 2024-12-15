import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Button,
  Alert,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useState, useEffect } from 'react';
import { parse, format } from 'date-fns';
import { WorkingHours, DayOfWeek, CreateWorkingHoursData } from '../../services/scheduleService';

interface WorkingHoursFormProps {
  workingHours: WorkingHours[] | undefined;
  onSave: (workingHours: CreateWorkingHoursData[]) => void;
  isLoading?: boolean;
}

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '17:00';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const formatDayOfWeek = (day: DayOfWeek): string => {
  return day.charAt(0) + day.slice(1).toLowerCase();
};

const timeToDate = (timeString: string): Date => {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  } catch (error) {
    console.error('Error parsing time:', timeString, error);
    return new Date();
  }
};

const dateToTimeString = (date: Date): string => {
  try {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return '00:00';
  }
};

export function WorkingHoursForm({
  workingHours = [],
  onSave,
  isLoading = false,
}: WorkingHoursFormProps) {
  const [editedHours, setEditedHours] = useState<Map<DayOfWeek, WorkingHours>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hoursMap = new Map<DayOfWeek, WorkingHours>();
    
    // Initialize with default values for all days
    DAYS_OF_WEEK.forEach(day => {
      const isWorkingDay = day !== 'SUNDAY';
      hoursMap.set(day, {
        id: '',
        dayOfWeek: day,
        startTime: isWorkingDay ? DEFAULT_START_TIME : '00:00',
        endTime: isWorkingDay ? DEFAULT_END_TIME : '00:00',
        isWorkingDay,
        therapistId: workingHours?.[0]?.therapistId,
      });
    });

    // Override with actual values if they exist
    if (Array.isArray(workingHours)) {
      workingHours.forEach(hours => {
        if (hours && hours.dayOfWeek) {
          // Keep existing times if they're valid, otherwise use defaults based on working day status
          const isWorkingDay = hours.isWorkingDay ?? (hours.dayOfWeek !== 'SUNDAY');
          const startTime = hours.startTime && hours.startTime !== '00:00' ? hours.startTime : (isWorkingDay ? DEFAULT_START_TIME : '00:00');
          const endTime = hours.endTime && hours.endTime !== '00:00' ? hours.endTime : (isWorkingDay ? DEFAULT_END_TIME : '00:00');
          
          hoursMap.set(hours.dayOfWeek, {
            ...hours,
            startTime,
            endTime,
            isWorkingDay,
          });
        }
      });
    }

    setEditedHours(hoursMap);
  }, [workingHours]);

  const handleWorkingDayToggle = (day: DayOfWeek) => {
    const current = editedHours.get(day);
    if (current) {
      const isWorkingDay = !current.isWorkingDay;
      const newHours = {
        ...current,
        isWorkingDay,
        // Reset times based on working day status
        startTime: isWorkingDay ? DEFAULT_START_TIME : '00:00',
        endTime: isWorkingDay ? DEFAULT_END_TIME : '00:00',
      };

      const newMap = new Map(editedHours);
      newMap.set(day, newHours);
      setEditedHours(newMap);
      setHasChanges(true);

      console.log(`Toggled working day for ${day}:`, newHours);
    }
  };

  const handleTimeChange = (day: DayOfWeek, field: 'startTime' | 'endTime', date: Date | null) => {
    if (!date) return;

    const current = editedHours.get(day);
    if (current) {
      // Format the time using our helper
      const timeString = dateToTimeString(date);
      console.log(`Setting ${field} for ${day} to ${timeString}`);

      const updatedHours = {
        ...current,
        [field]: timeString,
        isWorkingDay: true
      };

      // Only validate times if both start and end times are set
      if (updatedHours.startTime && updatedHours.endTime) {
        if (field === 'endTime' && updatedHours.startTime >= timeString) {
          setError('End time must be after start time');
          return;
        }
        if (field === 'startTime' && timeString >= updatedHours.endTime) {
          setError('Start time must be before end time');
          return;
        }
      }

      setError(null);
      const newMap = new Map(editedHours);
      newMap.set(day, updatedHours);
      setEditedHours(newMap);
      setHasChanges(true);

      console.log(`Updated hours for ${day}:`, updatedHours);
    }
  };

  const handleSave = () => {
    const workingHoursData: CreateWorkingHoursData[] = Array.from(editedHours.values()).map(hours => {
      // For working days, use the actual times. For non-working days, use 00:00
      const startTime = hours.isWorkingDay ? hours.startTime : '00:00';
      const endTime = hours.isWorkingDay ? hours.endTime : '00:00';
      
      const data = {
        dayOfWeek: hours.dayOfWeek,
        startTime,
        endTime,
        isWorkingDay: hours.isWorkingDay,
        therapistId: hours.therapistId,
      };

      console.log(`Saving hours for ${hours.dayOfWeek}:`, data);
      return data;
    });
    
    console.log('Saving working hours:', JSON.stringify(workingHoursData, null, 2));
    onSave(workingHoursData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell align="center">Working Day</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DAYS_OF_WEEK.map((day) => {
                const hours = editedHours.get(day);
                if (!hours) return null;

                return (
                  <TableRow key={day}>
                    <TableCell component="th" scope="row">
                      {formatDayOfWeek(day)}
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={hours.isWorkingDay}
                        onChange={() => handleWorkingDayToggle(day)}
                        disabled={isLoading}
                      />
                    </TableCell>
                    <TableCell>
                      <TimePicker
                        label="Start Time"
                        value={timeToDate(hours.startTime)}
                        onChange={(date) => handleTimeChange(day, 'startTime', date)}
                        disabled={!hours.isWorkingDay || isLoading}
                        ampm={false}
                        views={['hours', 'minutes']}
                        format="HH:mm"
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TimePicker
                        label="End Time"
                        value={timeToDate(hours.endTime)}
                        onChange={(date) => handleTimeChange(day, 'endTime', date)}
                        disabled={!hours.isWorkingDay || isLoading}
                        ampm={false}
                        views={['hours', 'minutes']}
                        format="HH:mm"
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={!hasChanges || isLoading || !!error}
        sx={{ mt: 2 }}
      >
        Save Working Hours
      </Button>
    </LocalizationProvider>
  );
}
