// src/features/dashboard/components/StatCard.tsx
type StatCardProps = {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    accent?: "blue" | "green" | "amber" | "violet";
};

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
    blue: "from-blue-500/40 to-sky-500/20",
    green: "from-emerald-500/40 to-lime-500/20",
    amber: "from-amber-500/40 to-orange-500/20",
    violet: "from-violet-500/40 to-fuchsia-500/20",
};

export default function StatCard({
    title,
    value,
    icon,
    accent = "blue",
}: StatCardProps) {
    return (
        <div
            className="
        relative overflow-hidden
        bg-slate-900/70 border border-slate-800
        rounded-2xl p-5 shadow-lg
        backdrop-blur-xl
        hover:bg-slate-900/90 transition
      "
        >
            {/* Glow */}
            <div
                className={`
          pointer-events-none absolute inset-0 opacity-40
          bg-linear-to-br ${accentClasses[accent]}
        `}
            />

            <div className="relative flex items-start justify-between">
                <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {title}
                    </h3>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>
                </div>

                {icon && (
                    <div className="w-9 h-9 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-center text-lg">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
