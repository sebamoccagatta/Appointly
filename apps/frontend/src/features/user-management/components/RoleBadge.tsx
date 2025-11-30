import type { UserRole } from "../hooks/useUsers";

export function RoleBadge({ role }: { role: UserRole }) {
    const base =
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border";

    if (role === "ADMIN") {
        return (
            <span
                className={`${base} bg-red-500/10 text-red-300 border-red-500/60`}
            >
                ADMIN
            </span>
        );
    }
    if (role === "ASSISTANT") {
        return (
            <span
                className={`${base} bg-amber-500/10 text-amber-200 border-amber-500/60`}
            >
                ASSISTANT
            </span>
        );
    }
    return (
        <span
            className={`${base} bg-emerald-500/10 text-emerald-200 border-emerald-500/60`}
        >
            USER
        </span>
    );
}
