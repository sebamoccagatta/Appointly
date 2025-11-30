import { Link } from "react-router-dom";
import {
    useOfferingsList,
    useToggleOfferingStatus,
} from "../hooks/useOfferings";

export default function OfferingListPage() {
    const { data, isLoading } = useOfferingsList();
    const toggleStatus = useToggleOfferingStatus();

    if (isLoading)
        return <p className="text-slate-300">Cargando servicios...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6 mt-10">
                <h1 className="text-xl font-bold text-white">Servicios</h1>
                <Link
                    to="/admin/offerings/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition"
                >
                    Nuevo servicio
                </Link>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/60">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Duración</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {Array.isArray(data) &&
                            data.map((off: any) => (
                                <tr key={off.id} className="hover:bg-slate-900/60">
                                    <td className="px-4 py-3 text-slate-100">{off.name}</td>
                                    <td className="px-4 py-3 text-slate-300">
                                        {off.durationMinutes} min
                                    </td>
                                    <td className="px-4 py-3">
                                        {off.status === "ACTIVE" ? (
                                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-300 border border-red-500/40">
                                                Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
                                                to={`/admin/offerings/${off.id}`}
                                            >
                                                Editar
                                            </Link>

                                            <button
                                                onClick={() =>
                                                    toggleStatus.mutate({
                                                        id: off.id,
                                                        status: off.status,
                                                    })
                                                }
                                                className="px-2 py-1 text-xs rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
                                            >
                                                {off.status === "ACTIVE" ? "Desactivar" : "Activar"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
