// src/features/dashboard/components/DashboardHeader.tsx
import { useAuth } from "../../auth/AuthContext";

export default function DashboardHeader() {
    const { user } = useAuth();
    const firstName = user?.name?.split(" ")[0] ?? "Usuario";

    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
                Hola, {firstName} 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
                Tu día está listo para comenzar. Revisá tus citas y seguí trabajando en tu agenda.
            </p>
        </div>
    );
}
