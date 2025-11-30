import { useState } from "react";
import { useOfferingsList } from "../../offerings/hooks/useOfferings";
import { useMySchedule } from "../../schedule/hooks/useSchedule";
import { useAvailability } from "../hooks/useAvailability";
import { useCreateAppointment } from "../hooks/useAppointments";
import { useCustomersList } from "../../customers/hooks/useCustomers";
import type { CustomerDTO } from "../../../services/api/apiCustomers";

function combineToISO(date: string, time: string) {
    return `${date}T${time}:00.000Z`;
}

export default function AppointmentBookingPage() {
    const [selectedOfferingId, setSelectedOfferingId] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>(""); // "YYYY-MM-DD"
    const [selectedTime, setSelectedTime] = useState<string | null>(null); // "HH:MM"
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

    const { data: offeringsData, isLoading: isLoadingOfferings } = useOfferingsList();
    const { data: schedule } = useMySchedule();
    const { data: availability, isLoading: isLoadingAvailability } = useAvailability(
        selectedDate || null,
        selectedOfferingId || null
    );
    const { data: customers, isLoading: isLoadingCustomers } = useCustomersList();

    const createAppointment = useCreateAppointment();

    function handleBook() {
        if (
            !schedule?.id ||
            !selectedOfferingId ||
            !selectedDate ||
            !selectedTime ||
            !selectedCustomerId
        ) {
            return;
        }

        const startISO = combineToISO(selectedDate, selectedTime);

        createAppointment.mutate({
            scheduleId: schedule.id,
            offeringId: selectedOfferingId,
            customerId: selectedCustomerId,
            start: startISO,
        });
    }

    const selectedServiceName =
        Array.isArray(offeringsData)
            ? offeringsData.find((o: any) => o.id === selectedOfferingId)?.name ?? "No seleccionado"
            : "No seleccionado";

    const selectedCustomerName =
        selectedCustomerId && customers
            ? (customers.find((c: CustomerDTO) => c.id === selectedCustomerId)?.name ?? "Desconocido")
            : "No seleccionado";

    return (
        <div className="mt-10 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">Nuevo turno</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Elegí un servicio, una fecha, un cliente y un horario disponible.
                    </p>
                </div>
            </div>

            {/* Filtros: servicio, fecha, cliente */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Servicio */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Servicio
                    </label>
                    {isLoadingOfferings ? (
                        <p className="text-xs text-slate-500">Cargando servicios...</p>
                    ) : (
                        <select
                            value={selectedOfferingId}
                            onChange={(e) => {
                                setSelectedOfferingId(e.target.value);
                                setSelectedTime(null);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Seleccioná un servicio</option>
                            {Array.isArray(offeringsData) &&
                                offeringsData.map((off: any) => (
                                    <option key={off.id} value={off.id}>
                                        {off.name} ({off.durationMinutes} min)
                                    </option>
                                ))}
                        </select>
                    )}
                </div>

                {/* Fecha */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Fecha
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setSelectedTime(null);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Cliente */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Cliente
                    </label>
                    {isLoadingCustomers ? (
                        <p className="text-xs text-slate-500">Cargando clientes...</p>
                    ) : (
                        <select
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Seleccioná un cliente</option>
                            {customers?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.email ? `(${c.email})` : ""}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Resumen + botón confirmar */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-sm text-slate-300 space-y-1">
                    <p>
                        Servicio: <span className="font-medium">{selectedServiceName}</span>
                    </p>
                    <p>
                        Fecha:{" "}
                        <span className="font-medium">
                            {selectedDate || "No seleccionada"}
                        </span>
                    </p>
                    <p>
                        Cliente: <span className="font-medium">{selectedCustomerName}</span>
                    </p>
                    <p>
                        Horario:{" "}
                        <span className="font-medium">
                            {selectedTime || "No seleccionado"}
                        </span>
                    </p>
                </div>

                <div className="md:text-right">
                    <button
                        onClick={handleBook}
                        disabled={
                            !schedule?.id ||
                            !selectedDate ||
                            !selectedOfferingId ||
                            !selectedTime ||
                            !selectedCustomerId ||
                            createAppointment.isPending
                        }
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium
                       bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50
                       disabled:cursor-not-allowed transition"
                    >
                        {createAppointment.isPending ? "Creando turno..." : "Confirmar turno"}
                    </button>

                    {createAppointment.isError && (
                        <p className="mt-2 text-xs text-red-400">
                            Ocurrió un error al crear el turno.
                        </p>
                    )}

                    {createAppointment.isSuccess && (
                        <p className="mt-2 text-xs text-emerald-400">
                            Turno creado correctamente.
                        </p>
                    )}
                </div>
            </div>

            {/* Slots disponibles */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <h2 className="text-sm font-semibold text-slate-200 mb-3">
                    Horarios disponibles
                </h2>

                {!selectedOfferingId || !selectedDate ? (
                    <p className="text-xs text-slate-500">
                        Seleccioná un servicio y una fecha para ver los horarios disponibles.
                    </p>
                ) : isLoadingAvailability ? (
                    <p className="text-xs text-slate-500">Cargando disponibilidad...</p>
                ) : !availability || availability.slots.length === 0 ? (
                    <p className="text-xs text-slate-500">
                        No hay horarios disponibles para ese día.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {availability.slots.map((slot) => (
                            <button
                                key={slot.start}
                                type="button"
                                onClick={() => setSelectedTime(slot.start)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition
                  ${selectedTime === slot.start
                                        ? "bg-blue-600 text-white border-blue-400"
                                        : "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                                    }`}
                            >
                                {slot.start}–{slot.end}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
