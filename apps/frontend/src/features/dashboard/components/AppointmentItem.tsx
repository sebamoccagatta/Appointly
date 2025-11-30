// src/features/dashboard/components/AppointmentItem.tsx
import type { DashboardAppointment } from "../hooks/useDashboard";

export default function AppointmentItem({ appt }: { appt: DashboardAppointment }) {
    const statusColor =
        appt.status === "CONFIRMED"
            ? "text-emerald-400 bg-emerald-500/10"
            : appt.status === "PENDING"
                ? "text-amber-300 bg-amber-500/10"
                : "text-slate-300 bg-slate-500/10";

    return (
        <div
            className="
        flex items-center justify-between 
        bg-slate-900/70 border border-slate-800
        rounded-xl p-4
      "
        >
            <div>
                <p className="text-sm font-semibold text-white">
                    {appt.clientName}
                </p>
                <p className="text-xs text-slate-400">{appt.service}</p>
            </div>

            <div className="text-right">
                <p className="text-xs text-slate-300">{appt.time}</p>
                {appt.status && (
                    <span
                        className={`
              inline-block mt-1 px-2 py-0.5 rounded-full text-[10px]
              ${statusColor}
            `}
                    >
                        {appt.status === "CONFIRMED"
                            ? "Confirmada"
                            : appt.status === "PENDING"
                                ? "Pendiente"
                                : "Cancelada"}
                    </span>
                )}
            </div>
        </div>
    );
}
