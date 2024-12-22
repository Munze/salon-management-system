import React from 'react';
import { useState, useCallback, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventContentArg, DateSelectArg } from '@fullcalendar/core';
import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
  Box,
  IconButton,
  Tooltip,
  Paper,
  Typography,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import './AppointmentCalendar.css';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { Client } from '../../types/client';
import { Therapist } from '../../types/therapist';
import { WorkingHours } from '../../types/schedule';
import { CreateAppointmentData } from '../../services/appointmentService';
import { format } from 'date-fns';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSelectSlot?: (slotInfo: DateSelectArg) => void;
  onSelectEvent?: (appointment: Appointment) => void;
  onUpdateAppointment?: (appointment: Appointment) => Promise<void>;
  isLoading?: boolean;
  workingHours?: WorkingHours[];
  therapists: Therapist[];
  onViewChange?: (view: string) => void;
  onDatesSet?: (dateInfo: { view: { currentStart: Date; type: string } }) => void;
  view?: any;
  initialView?: string;
  initialDate?: Date;
  scrollTime?: string;
}

export const AppointmentCalendar = React.forwardRef<FullCalendar, AppointmentCalendarProps>(({
  appointments,
  onSelectSlot,
  onSelectEvent,
  onUpdateAppointment,
  isLoading = false,
  workingHours = [],
  therapists,
  onViewChange,
  onDatesSet,
  view,
  initialView,
  initialDate,
  scrollTime
}, ref) => {
  const handleEventClick = (clickInfo: any) => {
    console.log('Event clicked:', clickInfo);
    const appointment = {
      ...clickInfo.event.extendedProps,
      id: clickInfo.event.id,
      startTime: clickInfo.event.start.toISOString(),
      endTime: clickInfo.event.end.toISOString(),
    };
    console.log('Processed appointment:', appointment);
    onSelectEvent?.(appointment);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onSelectSlot) {
      onSelectSlot(selectInfo);
    }
  };

  const handleDatesSet = (dateInfo: any) => {
    if (onDatesSet && (!view?.currentStart || dateInfo.view.currentStart.getTime() !== new Date(view.currentStart).getTime())) {
      onDatesSet({
        view: {
          currentStart: dateInfo.start,
          type: dateInfo.view.type
        }
      });
    }
  };

  const handleViewDidMount = (info: any) => {
    console.log('View mounted:', info);
    if (onViewChange) {
      onViewChange(info.view.type);
    }
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const appointment = eventInfo.event.extendedProps;
    const { backgroundColor, textColor } = generateEventColors(appointment.therapist.name);

    const startTime = eventInfo.event.start;
    const endTime = eventInfo.event.end;
    
    if (!startTime || !endTime) {
      console.error('Missing start or end time for event:', eventInfo);
      return null;
    }

    const timeStr = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
    const statusColor = getStatusColor(appointment.status);

    return (
      <div style={{ 
        padding: '2px 4px', 
        backgroundColor, 
        color: textColor,
        borderRadius: '4px',
        height: '100%',
        overflow: 'hidden'
      }}>
        <div style={{ 
          fontSize: '0.9em', 
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{timeStr}</span>
          <span style={{ 
            backgroundColor: statusColor,
            color: '#fff',
            padding: '1px 6px',
            borderRadius: '3px',
            fontSize: '0.8em'
          }}>
            {statusLabels[appointment.status] || 'Nepoznato'}
          </span>
        </div>
        <div style={{ fontSize: '0.9em' }}>
          {appointment.client?.name || 'Nepoznat klijent'}
        </div>
        <div style={{ fontSize: '0.85em', opacity: 0.9 }}>
          {appointment.service?.name || 'Nepoznata usluga'}
        </div>
      </div>
    );
  };

  const statusLabels = {
    [AppointmentStatus.SCHEDULED]: 'Zakazano',
    [AppointmentStatus.CONFIRMED]: 'Potvrđeno',
    [AppointmentStatus.IN_PROGRESS]: 'U toku',
    [AppointmentStatus.COMPLETED]: 'Završeno',
    [AppointmentStatus.CANCELLED]: 'Otkazano',
    [AppointmentStatus.NO_SHOW]: 'Nije se pojavio/la',
  };

  const generateEventColors = (name: string) => {
    const colors = [
      { backgroundColor: '#e3f2fd', textColor: '#1565c0' }, // Blue
      { backgroundColor: '#f3e5f5', textColor: '#7b1fa2' }, // Purple
      { backgroundColor: '#e8f5e9', textColor: '#2e7d32' }, // Green
      { backgroundColor: '#fff3e0', textColor: '#e65100' }, // Orange
      { backgroundColor: '#fce4ec', textColor: '#c2185b' }, // Pink
      { backgroundColor: '#e0f2f1', textColor: '#00695c' }, // Teal
    ];
    
    const index = Math.abs(hashString(name)) % colors.length;
    return colors[index];
  };

  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  };

  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return '#ffa726'; // Orange
      case AppointmentStatus.CONFIRMED:
        return '#66bb6a'; // Green
      case AppointmentStatus.IN_PROGRESS:
        return '#42a5f5'; // Blue
      case AppointmentStatus.COMPLETED:
        return '#9575cd'; // Purple
      case AppointmentStatus.CANCELLED:
        return '#ef5350'; // Red
      case AppointmentStatus.NO_SHOW:
        return '#ec407a'; // Pink
      default:
        return '#78909c'; // Grey
    }
  };

  // Helper function to check if a day is working day
  const isWorkingDay = useCallback((date: Date) => {
    if (!Array.isArray(workingHours) || workingHours.length === 0) {
      return false; // If no working hours set, no days are working days
    }

    const day = date.getDay();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayNames[day];
    
    return workingHours.some(wh => 
      wh.dayOfWeek === dayName && 
      wh.isWorkingDay
    );
  }, [workingHours]);

  // Get business hours from working hours settings
  const businessHours = useMemo(() => {
    if (!Array.isArray(workingHours) || workingHours.length === 0) {
      return [{
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        startTime: '09:00',
        endTime: '17:00'
      }];
    }

    return workingHours
      .filter(wh => wh.isWorkingDay)
      .map(wh => ({
        daysOfWeek: [['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
          .indexOf(wh.dayOfWeek as string)],
        startTime: wh.startTime,
        endTime: wh.endTime
      }));
  }, [workingHours]);

  // Get earliest start time and latest end time for the entire week
  const { slotMinTime, slotMaxTime } = useMemo(() => {
    console.log('Working hours from database:', workingHours);

    if (!Array.isArray(workingHours) || workingHours.length === 0) {
      console.log('No working hours found, using defaults');
      return {
        slotMinTime: '09:00:00',
        slotMaxTime: '17:00:00'
      };
    }

    const workingDays = workingHours.filter(wh => wh.isWorkingDay);
    console.log('Working days:', workingDays);
    
    if (workingDays.length === 0) {
      console.log('No working days found, using defaults');
      return {
        slotMinTime: '09:00:00',
        slotMaxTime: '17:00:00'
      };
    }

    // Find earliest start time and latest end time across all working days
    const startTimes = workingDays.map(wh => wh.startTime);
    const endTimes = workingDays.map(wh => wh.endTime);
    
    console.log('Start times:', startTimes);
    console.log('End times:', endTimes);
    
    // Find the earliest start time and latest end time
    const earliestStart = startTimes.reduce((a, b) => a < b ? a : b);
    const latestEnd = endTimes.reduce((a, b) => a > b ? a : b);

    console.log('Earliest start:', earliestStart);
    console.log('Latest end:', latestEnd);

    const result = {
      slotMinTime: earliestStart + ':00',
      slotMaxTime: latestEnd + ':00'
    };

    console.log('Final slot times:', result);
    return result;
  }, [workingHours]);

  // Get working days for calendar display
  const nonWorkingDays = useMemo(() => {
    if (!Array.isArray(workingHours) || workingHours.length === 0) {
      return [0, 6]; // Sunday and Saturday
    }

    const workingDayNumbers = workingHours
      .filter(wh => wh.isWorkingDay)
      .map(wh => ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        .indexOf(wh.dayOfWeek as string));

    return [0, 1, 2, 3, 4, 5, 6].filter(day => !workingDayNumbers.includes(day));
  }, [workingHours]);

  return (
    <div style={{ 
      height: 'calc(100vh - 80px)', 
      width: 'calc(100vw - var(--sidebar-width))', 
      padding: '20px', 
      overflow: 'hidden' 
    }}>
      <style>
        {`
          .fc {
            height: 100%;
            width: 100%;
          }

          .fc-header-toolbar {
            padding: 10px;
            margin-bottom: 0 !important;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .fc-toolbar-title {
            font-size: 1.5em !important;
            text-transform: capitalize;
          }

          .fc-button {
            padding: 6px 16px !important;
            font-size: 0.875rem !important;
            min-width: 64px !important;
            border-radius: 4px !important;
            text-transform: none !important;
          }

          .fc-newAppointment-button {
            background-color: #1976d2 !important;
            border-color: #1976d2 !important;
            color: white !important;
          }

          .fc-newAppointment-button:hover {
            background-color: #1565c0 !important;
            border-color: #1565c0 !important;
          }

          .fc-view-harness {
            height: calc(100% - 80px) !important;
            background: white;
          }

          .fc-scrollgrid-sync-table {
            height: 100% !important;
          }

          .fc-timegrid-slot {
            height: 40px !important;
          }

          .non-working-hours {
            background-color: rgba(255, 200, 200, 0.3);
          }

          .fc-day-today {
            background: rgba(25, 118, 210, 0.05) !important;
          }

          .fc-timegrid-now-indicator-line {
            border-color: #1976d2;
          }

          .fc-timegrid-now-indicator-arrow {
            border-color: #1976d2;
            color: #1976d2;
          }
        `}
      </style>
      {console.log('Rendering calendar with appointments:', appointments)}
      <FullCalendar
        ref={ref}
        plugins={[timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today newAppointment',
          center: 'title',
          right: 'timeGridDay,timeGridWeek'
        }}
        customButtons={{
          newAppointment: {
            text: 'Novi Termin',
            click: () => {
              if (onSelectSlot) {
                const now = new Date();
                const end = new Date(now.getTime() + 30 * 60000); // Add 30 minutes
                onSelectSlot({
                  start: now,
                  end: end,
                  allDay: false,
                  view: ref.current?.getApi().view
                } as DateSelectArg);
              }
            }
          }
        }}
        buttonText={{
          today: 'Danas',
          week: 'Nedelja',
          day: 'Dan'
        }}
        locale="sr-latn"
        initialView={initialView || 'timeGridWeek'}
        initialDate={initialDate}
        scrollTime={scrollTime || slotMinTime}
        firstDay={1}
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        businessHours={businessHours}
        hiddenDays={nonWorkingDays}
        scrollTimeReset={false}
        events={appointments.map(appointment => ({
          id: appointment.id,
          title: `${appointment.client?.name || 'No Client'} - ${appointment.service?.name || 'No Service'}`,
          start: new Date(appointment.startTime),
          end: new Date(appointment.endTime),
          resourceId: appointment.therapistId,
          extendedProps: {
            status: appointment.status,
            client: appointment.client,
            service: appointment.service,
            therapist: appointment.therapist,
            price: appointment.price
          }
        }))}
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        allDaySlot={false}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        select={handleDateSelect}
        selectConstraint="businessHours"
        expandRows={true}
        stickyHeaderDates={true}
        height="100%"
        slotDuration="00:15:00"
        slotLabelInterval="01:00"
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        dayHeaderFormat={{ weekday: 'long', month: 'numeric', day: 'numeric', omitCommas: true }}
        dayCellClassNames={(arg) => {
          return !isWorkingDay(arg.date) ? 'non-working-day' : '';
        }}
        slotLaneClassNames={(arg) => {
          return !isWorkingDay(arg.date) ? 'non-working-day' : '';
        }}
        datesSet={handleDatesSet}
        viewDidMount={handleViewDidMount}
      />
    </div>
  );
});
