// src/features/dashboard/DashboardPage.tsx
import { useAuth } from "../auth/AuthContext";
import AdminDashboard from "./roles/AdminDashboard";
import AssistantDashboard from "./roles/AssistantDashboard";
import UserDashboard from "./roles/UserDashboard";

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) return null;

    if (user.role === "ADMIN") return <AdminDashboard />;
    if (user.role === "ASSISTANT") return <AssistantDashboard />;

    return <UserDashboard />; // USER
}
