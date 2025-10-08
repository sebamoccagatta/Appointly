export const AppointmentStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  ATTENDED: "ATTENDED",
  NO_SHOW: "NO_SHOW",
  CANCELLED: "CANCELLED",
} as const;
export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export interface AuditEvent {
  at: Date;
  byUserId: string;
  action: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  scheduleId: string;
  offeringId: string;
  professionalId: string;
  customerId: string;
  start: Date;
  end: Date;
  status: AppointmentStatus;
  notes?: string;
  audit?: AuditEvent[];
  createdAt: Date;
  updatedAt: Date;
}
