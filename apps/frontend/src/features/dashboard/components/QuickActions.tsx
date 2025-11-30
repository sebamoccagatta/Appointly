import { useNavigate } from "react-router-dom";

type QuickActionsProps = {
    adminMode?: boolean;
    assistantMode?: boolean;
    userMode?: boolean;
};

type Action = {
    id: string;
    label: string;
    description: string;
    onClick: () => void;
};

export default function QuickActions({
    adminMode,
    assistantMode,
    userMode,
}: QuickActionsProps) {
    const navigate = useNavigate();

    const actions: Action[] = [];

    if (userMode) {
        actions.push(
            {
                id: "new-appointment",
                label: "Nueva cita",
                description: "Reservá una nueva cita en tu agenda.",
                onClick: () => {
                    navigate("/appointments/new");
                },
            },
            {
                id: "my-appointments",
                label: "Ver mis citas",
                description: "Revisá el historial y próximas citas.",
                onClick: () => {
                    navigate("/appointments/mine");
                },
            }
        );
    }

    if (assistantMode) {
        actions.push(
            {
                id: "today-agenda",
                label: "Agenda de hoy",
                description: "Revisá las citas que tenés para hoy.",
                onClick: () => {
                    // TODO: ruta futura
                    console.log("Ir a agenda asistente");
                },
            },
            {
                id: "create-user",
                label: "Crear usuario",
                description: "Dar de alta un nuevo cliente o usuario.",
                onClick: () => {
                    navigate("/admin/users");
                },
            }
        );
    }

    if (adminMode) {
        actions.push(
            {
                id: "users-crud",
                label: "Gestionar usuarios",
                description: "Accede al panel completo de usuarios.",
                onClick: () => {
                    navigate("/admin/users");
                },
            },
            {
                id: "services",
                label: "Servicios",
                description: "Configura los servicios y duraciones.",
                onClick: () => {
                    navigate("/admin/offerings");
                },
            }
        );
    }

    if (actions.length === 0) return null;

    return (
        <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-3">
                Acciones rápidas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={action.onClick}
                        className="text-left group rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 hover:border-blue-500/70 hover:bg-slate-900 transition flex flex-col gap-1"
                    >
                        <span className="text-sm font-medium text-slate-100 group-hover:text-white">
                            {action.label}
                        </span>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300">
                            {action.description}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
