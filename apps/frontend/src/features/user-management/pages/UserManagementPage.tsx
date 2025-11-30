import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
    useUsersList,
    useUserMutations,
    type UserListItem,
    type UserRole,
} from "../hooks/useUsers";
import { UserTable } from "../components/UserTable";
import { UserEditorModal } from "../components/UserEditorModal";

export default function UserManagementPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const isAssistant = user?.role === "ASSISTANT";

    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

    const { data, isLoading } = useUsersList({
        page,
        pageSize,
        q: q || undefined,
        role: roleFilter,
    });

    const {
        createMutation,
        updateMutation,
        statusMutation,
        resetPasswordMutation,
    } = useUserMutations();

    const [editorOpen, setEditorOpen] = useState(false);
    const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
    const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
    const [initialPasswordShown, setInitialPasswordShown] = useState<string | null>(null);

    const canEditRole = isAdmin;
    const canToggleStatus = isAdmin;

    const openCreate = () => {
        setSelectedUser(null);
        setEditorMode("create");
        setEditorOpen(true);
        setInitialPasswordShown(null);
    };

    const openEdit = (u: UserListItem) => {
        setSelectedUser(u);
        setEditorMode("edit");
        setEditorOpen(true);
        setInitialPasswordShown(null);
    };

    const handleEditorSubmit = async (data: {
        name: string;
        email: string;
        role?: UserRole;
    }) => {
        if (editorMode === "create") {
            const result = await createMutation.mutateAsync({
                name: data.name,
                email: data.email,
                role: data.role,
            });
            setInitialPasswordShown(result.initialPassword);
        } else if (selectedUser) {
            await updateMutation.mutateAsync({
                id: selectedUser.id,
                name: data.name,
                email: data.email,
                role: data.role,
            });
        }
        setEditorOpen(false);
    };

    const handleToggleStatus = async (u: UserListItem) => {
        const newStatus = u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
        await statusMutation.mutateAsync({ id: u.id, status: newStatus });
    };

    const handleResetPassword = async (u: UserListItem) => {
        await resetPasswordMutation.mutateAsync(u.id);
        alert("Se ha solicitado el reset de contraseña (stub).");
    };

    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="w-full max-w-6xl mx-auto px-4 pb-16 mt-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Gestión de usuarios</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Administra los usuarios del sistema, sus roles y estados.
                    </p>
                </div>

                {(isAdmin || isAssistant) && (
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                    >
                        Nuevo usuario
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                    className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Buscar por nombre o email..."
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setPage(1);
                    }}
                />

                <select
                    className="w-full sm:w-48 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value as UserRole | "ALL");
                        setPage(1);
                    }}
                >
                    <option value="ALL">Todos los roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="ASSISTANT">ASSISTANT</option>
                    <option value="USER">USER</option>
                </select>
            </div>

            {isLoading ? (
                <p className="text-sm text-slate-400">Cargando usuarios...</p>
            ) : (
                <UserTable
                    users={data?.items ?? []}
                    canEditRole={canEditRole}
                    canToggleStatus={canToggleStatus}
                    onEdit={openEdit}
                    onToggleStatus={handleToggleStatus}
                    onResetPassword={handleResetPassword}
                />
            )}

            {/* paginación */}
            {total > pageSize && (
                <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                    <span>
                        Página {page} de {totalPages} · {total} usuarios
                    </span>

                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-2 py-1 rounded-lg border border-slate-700 disabled:opacity-40"
                        >
                            Anterior
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="px-2 py-1 rounded-lg border border-slate-700 disabled:opacity-40"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            <UserEditorModal
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                mode={editorMode}
                initialUser={selectedUser}
                canEditRole={canEditRole}
                onSubmit={handleEditorSubmit}
            />
        </div>
    );
}
