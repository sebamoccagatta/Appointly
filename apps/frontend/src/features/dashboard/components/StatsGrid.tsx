// src/features/dashboard/components/StatsGrid.tsx
import StatCard from "./StatCard";
import type { DashboardStats } from "../hooks/useDashboard";

type StatsGridProps = {
    stats: DashboardStats;
    adminMode?: boolean;
    assistantMode?: boolean;
};

export default function StatsGrid({
    stats,
    adminMode,
    assistantMode,
}: StatsGridProps) {
    // Podés cambiar qué stats se muestran según el rol
    const cards = [
        {
            key: "today",
            title: "Citas de hoy",
            value: stats.today,
            icon: "📅",
            accent: "blue" as const,
        },
        {
            key: "pending",
            title: "Pendientes",
            value: stats.pending,
            icon: "⏳",
            accent: "amber" as const,
        },
        {
            key: "clients",
            title: adminMode ? "Clientes activos" : "Mis clientes",
            value: stats.clients,
            icon: "👥",
            accent: "green" as const,
        },
        {
            key: "revenue",
            title: adminMode ? "Ingresos hoy" : "Ingresos estimados",
            value: `$${stats.revenue}`,
            icon: "💰",
            accent: "violet" as const,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {cards.map((c) => (
                <StatCard
                    key={c.key}
                    title={c.title}
                    value={c.value}
                    icon={c.icon}
                    accent={c.accent}
                />
            ))}
        </div>
    );
}
