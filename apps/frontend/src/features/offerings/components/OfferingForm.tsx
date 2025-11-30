import { useState } from "react";

export default function OfferingForm({ initial, onSubmit, loading }: {
    initial?: { name: string; durationMinutes: number };
    onSubmit: (data: { name: string; durationMinutes: number }) => void;
    loading?: boolean;
}) {
    const [name, setName] = useState(initial?.name ?? "");
    const [duration, setDuration] = useState(initial?.durationMinutes ?? 30);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ name, durationMinutes: duration });
            }}
            className="space-y-4"
        >
            <div>
                <label className="text-sm text-slate-300">Nombre</label>
                <input
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="text-sm text-slate-300">Duración (minutos)</label>
                <input
                    type="number"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                />
            </div>

            <button
                className="w-full py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700"
                disabled={loading}
            >
                {loading ? "Guardando..." : "Guardar servicio"}
            </button>
        </form>
    );
}
