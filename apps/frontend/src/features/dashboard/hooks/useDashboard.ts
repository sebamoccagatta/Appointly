// src/features/dashboard/hooks/useDashboard.ts
import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/api/apiClient";

export type DashboardStats = {
    today: number;
    pending: number;
    clients: number;
    revenue: number;
};

export type DashboardAppointment = {
    id: string;
    clientName: string;
    time: string;
    service: string;
    status?: string;
};

type DashboardResponse = {
    stats: DashboardStats;
    upcoming: DashboardAppointment[];
};

export function useDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [upcoming, setUpcoming] = useState<DashboardAppointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await apiFetch<DashboardResponse>("/appointments/dashboard");
                if (cancelled) return;

                setStats(data.stats);
                setUpcoming(data.upcoming);
            } catch (err) {
                console.error("Error cargando dashboard:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return {
        stats,
        upcoming,
        loading,
    };
}
