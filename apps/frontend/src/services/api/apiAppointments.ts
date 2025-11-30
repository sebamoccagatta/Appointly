import { apiFetch } from "./apiClient";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type AppointmentDTO = {
    id: string;
    scheduleId: string;
    offeringId: string;
    professionalId: string;
    customerId: string;
    start: string; // ISO
    end: string;   // ISO
    status: AppointmentStatus;
    createdAt: string;
    updatedAt: string;
};

export async function createAppointment(input: {
    scheduleId: string;
    offeringId: string;
    customerId: string;
    start: string; // ISO
}) {
    return apiFetch<AppointmentDTO>("/appointments", {
        method: "POST",
        body: JSON.stringify(input),
    });
}