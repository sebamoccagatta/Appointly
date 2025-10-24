import type { Appointment } from "domain/src/entities/appointment.js";

type Role = "ADMIN" | "USER" | "ASSISTANT";

export const backendAppointmentPolicy = {
    canCancel(params: { actorId: string; actorRole: Role; appointment: Appointment }): boolean {
        const { actorId, actorRole, appointment } = params;
        if (actorRole === "ADMIN" || actorRole == "ASSISTANT") return true;
        return appointment.professionalId === actorId;
    }
};
