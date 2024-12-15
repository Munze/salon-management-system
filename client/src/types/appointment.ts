export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export interface Appointment {
  id: string;
  clientId: string;
  therapistId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  therapist?: {
    id: string;
    name: string;
    email: string;
    specialties: string[];
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentData {
  clientId: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

export interface UpdateAppointmentData {
  clientId?: string;
  therapistId?: string;
  startTime?: Date;
  endTime?: Date;
  status?: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
}

export interface AppointmentFilters {
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
  therapistId?: string;
  status?: AppointmentStatus[];
}
