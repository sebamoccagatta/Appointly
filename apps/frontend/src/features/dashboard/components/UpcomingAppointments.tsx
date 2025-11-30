// src/features/dashboard/components/UpcomingAppointments.tsx
import type { DashboardAppointment } from "../hooks/useDashboard";
import AppointmentItem from "./AppointmentItem";

type UpcomingAppointmentsProps = {
    upcoming: DashboardAppointment[];
    title?: string;
};

export default function UpcomingAppointments({
    upcoming,
    title = "Próximas citas",
}: UpcomingAppointmentsProps) {
    return (
        <div
            className="
        bg-slate-900/70 border border-slate-800
        rounded-2xl p-6 mb-10
        backdrop-blur-xl
        shadow-lg
      "
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <button className="text-xs text-blue-400 hover:text-blue-300 transition">
                    Ver todas →
                </button>
            </div>

            {upcoming.length === 0 ? (
                <p className="text-slate-400 text-sm">
                    No hay citas próximas.
                </p>
            ) : (
                <div className="space-y-3">
                    {upcoming.map((appt) => (
                        <AppointmentItem key={appt.id} appt={appt} />
                    ))}
                </div>
            )}
        </div>
    );
}
