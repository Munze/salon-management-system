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
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  therapists: Therapist[];
  onViewChange?: (view: string) => void;
  onDatesSet?: (dateInfo: { view: { currentStart: Date; type: string } }) => void;
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
  workingHours = {
    startTime: '08:00',
    endTime: '20:00'
  },
  therapists,
  onViewChange,
  onDatesSet,
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
    console.log('Dates set:', dateInfo);
    if (onDatesSet) {
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

  return (
    <div style={{ height: 'calc(100vh - 180px)', width: '100%' }}>
      <style>
        {`
          .non-working-day {
            background-color: #f5f5f5 !important;
            color: #9e9e9e !important;
            cursor: not-allowed !important;
          }
          .non-working-day .fc-timegrid-col-events {
            pointer-events: none !important;
          }
        `}
      </style>
      {console.log('Rendering calendar with appointments:', appointments)}
      <FullCalendar
        ref={ref}
        plugins={[timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek'
        }}
        buttonText={{
          today: 'Danas',
          week: 'Nedelja',
          day: 'Dan'
        }}
        initialView={initialView || 'timeGridWeek'}
        initialDate={initialDate}
        scrollTime={scrollTime || '09:00:00'}
        firstDay={1}
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday to Saturday
          startTime: workingHours?.startTime || '09:00',
          endTime: workingHours?.endTime || '17:00'
        }}
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
        slotMinTime={workingHours?.startTime || '09:00'}
        slotMaxTime={workingHours?.endTime || '17:00'}
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
        dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true }}
        dayCellClassNames={(arg) => {
          const day = arg.date.getDay();
          return day === 0 ? 'non-working-day' : '';
        }}
        slotLaneClassNames={(arg) => {
          const day = arg.date.getDay();
          return day === 0 ? 'non-working-day' : '';
        }}
        datesSet={handleDatesSet}
        viewDidMount={handleViewDidMount}
      />
    </div>
  );
});
