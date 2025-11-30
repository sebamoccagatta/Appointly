import { useNavigate } from "react-router-dom";

type PreviewUser = {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "ASSISTANT" | "USER";
};


const mockUsers: PreviewUser[] = [
    { id: "1", name: "Sebastián", email: "admin@mail.com", role: "ADMIN" },
    { id: "2", name: "Lucía Asistente", email: "assistant@mail.com", role: "ASSISTANT" },
    { id: "3", name: "Carlos Usuario", email: "user@mail.com", role: "USER" },
];

export default function UserManagementPreview() {
    const navigate = useNavigate();
    return (
        <div
            className="
        bg-slate-900/70 border border-slate-800
        rounded-2xl p-6 mb-10
        backdrop-blur-xl
        shadow-lg
      "
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                    Gestión de usuarios
                </h2>

                <button className="text-xs text-blue-400 hover:text-blue-300 transition" onClick={() => navigate("/admin/users")}>
                    Ver todos →

                </button>
            </div>

            <div className="space-y-3 text-sm">
                {mockUsers.map((u) => (
                    <div
                        key={u.id}
                        className="
              flex items-center justify-between
              bg-slate-900 border border-slate-800
              rounded-xl px-4 py-3
            "
                    >
                        <div>
                            <p className="text-white font-medium">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                        </div>

                        <span
                            className={`
                text-[11px] px-2 py-1 rounded-full
                ${u.role === "ADMIN"
                                    ? "bg-red-500/10 text-red-300 border border-red-500/40"
                                    : u.role === "ASSISTANT"
                                        ? "bg-amber-500/10 text-amber-200 border border-amber-500/40"
                                        : "bg-emerald-500/10 text-emerald-200 border border-emerald-500/40"
                                }
              `}
                        >
                            {u.role}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
