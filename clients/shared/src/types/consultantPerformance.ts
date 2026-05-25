export type AppointmentOutcome = 0 | 1 | 2 | 3;

export type ConsultantKpiDto = {
  consultantId: number;
  fullName: string;
  email: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  convertedAppointments: number;
  conversionRatePercent: number;
  averageSatisfactionScore: number | null;
  satisfactionResponseCount: number;
  pendingOutcomeCount: number;
};

export type AppointmentConversionSummaryDto = {
  totalAppointments: number;
  pendingCount: number;
  approvedCount: number;
  completedCount: number;
  cancelledCount: number;
  recordedConversions: number;
  inferredConversions: number;
  totalConverted: number;
  conversionRatePercent: number;
  averageSatisfactionScore: number | null;
};

export type ConsultantPerformanceBoardDto = {
  generatedAtUtc: string;
  conversion: AppointmentConversionSummaryDto;
  consultants: ConsultantKpiDto[];
};

export type RecordAppointmentOutcomeRequest = {
  id: number;
  outcome: AppointmentOutcome;
  linkedOrderId?: number | null;
  satisfactionScore?: number | null;
  outcomeNotes?: string | null;
};
