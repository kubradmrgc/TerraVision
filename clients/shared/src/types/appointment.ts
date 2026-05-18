export type AppointmentStatus = 1 | 2 | 3 | 4;

export type AppointmentDto = {
  id: number;
  customerId: number;
  consultantId: number;
  appointmentDate: string;
  notes: string;
  status: AppointmentStatus;
};

export type CreateAppointmentRequest = {
  consultantId: number;
  appointmentDate: string;
  notes: string;
};

export type UpdateAppointmentStatusRequest = {
  id: number;
  status: AppointmentStatus;
};
