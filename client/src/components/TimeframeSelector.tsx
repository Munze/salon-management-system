import React from 'react';
import { Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';
import srLatn from 'date-fns/locale/sr-Latn';

interface TimeframeSelectorProps {
  onChange: (range: [Date, Date], label: string) => void;
  selectedTimeframe?: string;
}

export function TimeframeSelector({ onChange, selectedTimeframe = 'Ovaj mesec' }: TimeframeSelectorProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState<Date | null>(new Date());
  const [endDate, setEndDate] = React.useState<Date | null>(new Date());
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCustomDialogClose = () => {
    setCustomDialogOpen(false);
    handleClose();
  };

  const handleCustomDateConfirm = () => {
    if (startDate && endDate) {
      onChange(
        [startOfDay(startDate), endOfDay(endDate)] as [Date, Date],
        `${startDate.toLocaleDateString('sr-Latn')} - ${endDate.toLocaleDateString('sr-Latn')}`
      );
      handleCustomDialogClose();
    }
  };

  const timeframes = [
    {
      label: 'Sledećih 30 dana',
      getRange: () => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 30);
        return [startOfDay(start), endOfDay(end)] as [Date, Date];
      },
    },
    {
      label: 'Sledećih 14 dana',
      getRange: () => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 14);
        return [startOfDay(start), endOfDay(end)] as [Date, Date];
      },
    },
    {
      label: 'Sledećih 7 dana',
      getRange: () => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 7);
        return [startOfDay(start), endOfDay(end)] as [Date, Date];
      },
    },
    {
      label: 'Ovaj mesec',
      getRange: () => [startOfMonth(new Date()), endOfMonth(new Date())] as [Date, Date],
    },
    {
      label: 'Poslednjih 7 dana',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return [startOfDay(start), endOfDay(end)] as [Date, Date];
      },
    },
    {
      label: 'Poslednjih 14 dana',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 14);
        return [startOfDay(start), endOfDay(end)] as [Date, Date];
      },
    },
    {
      label: 'Poslednjih 30 dana',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return [startOfDay(start), endOfDay(end)] as [Date, Date];
      },
    },
    {
      label: 'Prošli mesec',
      getRange: () => {
        const lastMonth = subMonths(new Date(), 1);
        return [startOfMonth(lastMonth), endOfMonth(lastMonth)] as [Date, Date];
      },
    },
    {
      label: 'Poslednja 3 meseca',
      getRange: () => [startOfMonth(subMonths(new Date(), 3)), endOfMonth(new Date())] as [Date, Date],
    },
    {
      label: 'Prilagođeni period',
      getRange: () => [startOfDay(new Date()), endOfDay(new Date())] as [Date, Date],
      custom: true,
    },
  ];

  const handleSelect = (timeframe: { label: string; getRange: () => [Date, Date]; custom?: boolean }) => {
    if (timeframe.custom) {
      setCustomDialogOpen(true);
    } else {
      const range = timeframe.getRange();
      onChange(range, timeframe.label);
      handleClose();
    }
  };

  return (
    <>
      <Button
        id="timeframe-button"
        aria-controls={open ? 'timeframe-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        startIcon={<CalendarIcon />}
        variant="outlined"
        size="small"
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          color: 'text.primary',
          borderColor: 'divider',
        }}
      >
        {selectedTimeframe}
      </Button>
      <Menu
        id="timeframe-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'timeframe-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {timeframes.map((timeframe, index) => (
          <MenuItem
            key={index}
            onClick={() => handleSelect(timeframe)}
            selected={timeframe.label === selectedTimeframe}
            sx={{
              fontSize: '0.875rem',
              py: 1,
              px: 2,
            }}
          >
            {timeframe.label}
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={customDialogOpen} onClose={handleCustomDialogClose}>
        <DialogTitle>Izaberite period</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={srLatn}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              <DatePicker
                label="Od"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                format="dd.MM.yyyy"
              />
              <DatePicker
                label="Do"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                format="dd.MM.yyyy"
                minDate={startDate || undefined}
              />
            </div>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCustomDialogClose}>Otkaži</Button>
          <Button onClick={handleCustomDateConfirm} variant="contained" color="primary">
            Potvrdi
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
