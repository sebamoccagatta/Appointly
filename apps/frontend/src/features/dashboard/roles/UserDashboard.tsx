// src/features/dashboard/roles/UserDashboard.tsx
import DashboardHeader from "../components/DashboardHeader";
import UpcomingAppointments from "../components/UpcomingAppointments";
import QuickActions from "../components/QuickActions";
import { useDashboard } from "../hooks/useDashboard";

export default function UserDashboard() {
    const { upcoming, loading } = useDashboard();

    if (loading) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4 pb-16 mt-10">
                <DashboardHeader />
                <p className="text-slate-400 text-sm">Cargando tus próximas citas...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 pb-16 mt-10">
            <DashboardHeader />

            <UpcomingAppointments upcoming={upcoming} title="Mis próximas citas" />

            <div className="mt-8">
                <QuickActions userMode />
            </div>
        </div>
    );
}
