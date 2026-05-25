import type { AppointmentOutcome } from './consultantPerformance';

export type AppointmentStatus = 1 | 2 | 3 | 4;

export type AppointmentDto = {
  id: number;
  customerId: number;
  consultantId: number;
  appointmentDate: string;
  notes: string;
  status: AppointmentStatus;
  outcome: AppointmentOutcome;
  linkedOrderId: number | null;
  satisfactionScore: number | null;
  outcomeNotes: string | null;
  outcomeRecordedAt: string | null;
  /** Base64 rowversion token for optimistic status updates. */
  rowVersion: string;
};
export type CreateAppointmentRequest = {
  consultantId: number;
  appointmentDate: string;
  notes: string;
};

export type UpdateAppointmentStatusRequest = {
  id: number;
  status: AppointmentStatus;
  /** Optional base64 rowversion from GET; omit to rely on server-loaded version. */
  rowVersion?: string;
};
