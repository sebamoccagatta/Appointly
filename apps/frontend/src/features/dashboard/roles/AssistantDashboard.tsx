// src/features/dashboard/roles/AssistantDashboard.tsx
import DashboardHeader from "../components/DashboardHeader";
import StatsGrid from "../components/StatsGrid";
import UpcomingAppointments from "../components/UpcomingAppointments";
import QuickActions from "../components/QuickActions";
import { useDashboard } from "../hooks/useDashboard";

export default function AssistantDashboard() {
    const { stats, upcoming, loading } = useDashboard();

    if (loading || !stats) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4 pb-16 mt-10">
                <DashboardHeader />
                <p className="text-slate-400 text-sm">Cargando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 pb-16 mt-10">
            <DashboardHeader />

            <StatsGrid stats={stats} assistantMode />

            <UpcomingAppointments upcoming={upcoming} />

            <div className="mt-8">
                <QuickActions assistantMode />
            </div>
        </div>
    );
}
