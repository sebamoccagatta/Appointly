// apps/frontend/src/modules/customers/pages/CustomersListPage.tsx
import { useState } from "react";
import { useCustomersList, useCreateCustomer } from "../hooks/useCustomers";

export default function CustomersListPage() {
    const [search, setSearch] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");

    const { data, isLoading } = useCustomersList(search || undefined);
    const createCustomer = useCreateCustomer();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        createCustomer.mutate(
            {
                name: name.trim(),
                email: email || undefined,
                phone: phone || undefined,
                notes: notes || undefined,
            },
            {
                onSuccess: () => {
                    setName("");
                    setEmail("");
                    setPhone("");
                    setNotes("");
                },
            }
        );
    }

    return (
        <div className="mt-10 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">Clientes</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Gestioná los clientes a los que les asignás turnos.
                    </p>
                </div>
            </div>

            {/* Filtros / búsqueda */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o teléfono..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Formulario rápido de alta */}
            <form
                onSubmit={handleSubmit}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3"
            >
                <div className="grid gap-3 md:grid-cols-4">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                            Teléfono
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="md:col-span-1 flex items-end">
                        <button
                            type="submit"
                            disabled={createCustomer.isLoading || !name.trim()}
                            className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium
                         bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {createCustomer.isLoading ? "Creando..." : "Agregar cliente"}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Notas
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </form>

            {/* Tabla de clientes */}
            <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/60">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Teléfono</th>
                            <th className="px-4 py-3">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                                    Cargando clientes...
                                </td>
                            </tr>
                        ) : !data || data.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                                    No hay clientes aún.
                                </td>
                            </tr>
                        ) : (
                            data.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-900/60">
                                    <td className="px-4 py-3 text-slate-100">{c.name}</td>
                                    <td className="px-4 py-3 text-slate-300">
                                        {c.email || <span className="text-slate-500">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">
                                        {c.phone || <span className="text-slate-500">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400">
                                        {c.notes || <span className="text-slate-600 text-xs">Sin notas</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
