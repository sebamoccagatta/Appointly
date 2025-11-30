import type { UserStatus } from "../hooks/useUsers";

export function StatusBadge({ status }: { status: UserStatus }) {
    const base =
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border";

    if (status === "ACTIVE") {
        return (
            <span
                className={`${base} bg-emerald-500/10 text-emerald-200 border-emerald-500/60`}
            >
                ACTIVO
            </span>
        );
    }
    return (
        <span
            className={`${base} bg-slate-700/60 text-slate-300 border-slate-500/70`}
        >
            BLOQUEADO
        </span>
    );
}
