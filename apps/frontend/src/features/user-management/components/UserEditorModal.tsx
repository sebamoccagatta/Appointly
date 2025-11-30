import { type FormEvent, useEffect, useState } from "react";
import type { UserListItem, UserRole } from "../hooks/useUsers";

type Props = {
    open: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    initialUser?: UserListItem | null;
    canEditRole: boolean;
    onSubmit: (data: { name: string; email: string; role?: UserRole }) => void;
};

const ROLES: UserRole[] = ["ADMIN", "ASSISTANT", "USER"];

export function UserEditorModal({
    open,
    onClose,
    mode,
    initialUser,
    canEditRole,
    onSubmit,
}: Props) {
    const [name, setName] = useState(initialUser?.name ?? "");
    const [email, setEmail] = useState(initialUser?.email ?? "");
    const [role, setRole] = useState<UserRole>(
        initialUser?.role ?? "USER"
    );

    useEffect(() => {
        if (open) {
            setName(initialUser?.name ?? "");
            setEmail(initialUser?.email ?? "");
            setRole(initialUser?.role ?? "USER");
        }
    }, [open, initialUser]);

    if (!open) return null;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit({ name, email, role: canEditRole ? role : undefined });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-white mb-4">
                    {mode === "create" ? "Crear usuario" : "Editar usuario"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-300 mb-1 block">
                            Nombre
                        </label>
                        <input
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-300 mb-1 block">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {canEditRole && (
                        <div>
                            <label className="text-xs text-slate-300 mb-1 block">
                                Rol
                            </label>
                            <select
                                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                            >
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
                        >
                            {mode === "create" ? "Crear" : "Guardar cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
