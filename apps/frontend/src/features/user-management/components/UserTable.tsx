import type { UserListItem } from "../hooks/useUsers";
import { RoleBadge } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
    users: UserListItem[];
    canEditRole: boolean;
    canToggleStatus: boolean;
    onEdit: (user: UserListItem) => void;
    onToggleStatus: (user: UserListItem) => void;
    onResetPassword: (user: UserListItem) => void;
};

export function UserTable({
    users,
    canEditRole,
    canToggleStatus,
    onEdit,
    onToggleStatus,
    onResetPassword,
}: Props) {
    if (users.length === 0) {
        return (
            <p className="text-sm text-slate-400">
                No se encontraron usuarios con los filtros actuales.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/60">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wide">
                    <tr>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Rol</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/60">
                            <td className="px-4 py-3 text-slate-100">{u.name}</td>
                            <td className="px-4 py-3 text-slate-300">{u.email}</td>
                            <td className="px-4 py-3">
                                <RoleBadge role={u.role} />
                            </td>
                            <td className="px-4 py-3">
                                <StatusBadge status={u.status} />
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(u)}
                                        className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => onResetPassword(u)}
                                        className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
                                    >
                                        Reset pass
                                    </button>

                                    {canToggleStatus && (
                                        <button
                                            onClick={() => onToggleStatus(u)}
                                            className="px-2 py-1 text-xs rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
                                        >
                                            {u.status === "ACTIVE" ? "Bloquear" : "Activar"}
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
