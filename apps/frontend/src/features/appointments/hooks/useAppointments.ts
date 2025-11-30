import { useMutation } from "@tanstack/react-query";
import { createAppointment, type AppointmentDTO } from "../../../services/api/apiAppointments";

export function useCreateAppointment() {
    return useMutation<AppointmentDTO, unknown, {
        scheduleId: string;
        offeringId: string;
        customerId: string;
        start: string;
    }>({
        mutationFn: createAppointment,
    });
}
