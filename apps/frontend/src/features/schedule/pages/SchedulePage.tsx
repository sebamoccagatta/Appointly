import { useEffect, useState } from "react";
import {
    useMySchedule,
    useUpdateMySchedule,
} from "../hooks/useSchedule";
import type { WeeklyItem } from "../../../services/api/apiSchedule";

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type LocalRule = {
    weekday: Weekday;
    start: string;
    end: string;
};

type RulesByDay = Record<Weekday, LocalRule[]>;

const WEEKDAYS_LABELS: { value: Weekday; label: string }[] = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" },
];

function createEmptyWeek(): RulesByDay {
    return {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
    };
}

export default function SchedulePage() {
    const { data, isLoading, isError } = useMySchedule();
    const updateSchedule = useUpdateMySchedule();

    const [rulesByDay, setRulesByDay] = useState<RulesByDay>(createEmptyWeek);
    const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
    const [bufferMinutes, setBufferMinutes] = useState(0);
    const [touched, setTouched] = useState(false);

    // Hydrate from API
    useEffect(() => {
        if (!data) return;

        const next = createEmptyWeek();
        for (const w of data.weeklyTemplate) {
            const weekday = w.weekday as Weekday;
            next[weekday].push({
                weekday,
                start: w.start,
                end: w.end,
            });
        }

        setRulesByDay(next);
        setTimezone(data.timezone);
        setBufferMinutes(data.bufferMinutes);
        setTouched(false);
    }, [data]);

    function handleAddRange(day: Weekday) {
        setRulesByDay((prev) => {
            const copy = { ...prev };
            const rules = [...copy[day]];

            rules.push({
                weekday: day,
                start: "09:00",
                end: "17:00",
            });

            copy[day] = rules;
            return copy;
        });
        setTouched(true);
    }

    function handleRemoveRange(day: Weekday, index: number) {
        setRulesByDay((prev) => {
            const copy = { ...prev };
            const rules = [...copy[day]];
            rules.splice(index, 1);
            copy[day] = rules;
            return copy;
        });
        setTouched(true);
    }

    function handleChangeRange(
        day: Weekday,
        index: number,
        field: "start" | "end",
        value: string
    ) {
        setRulesByDay((prev) => {
            const copy = { ...prev };
            const rules = [...copy[day]];
            const rule = { ...rules[index], [field]: value };
            rules[index] = rule;
            copy[day] = rules;
            return copy;
        });
        setTouched(true);
    }

    function handleSave() {
        const weeklyTemplate: WeeklyItem[] = [];

        (Object.keys(rulesByDay) as unknown as (keyof RulesByDay)[]).forEach((key) => {
            const day = Number(key) as Weekday;
            for (const r of rulesByDay[day]) {
                weeklyTemplate.push({
                    weekday: day,
                    start: r.start,
                    end: r.end,
                });
            }
        });

        updateSchedule.mutate({
            timezone,
            bufferMinutes,
            weeklyTemplate,
            exceptions: [], // por ahora vacío; después lo extendemos
        });
    }

    if (isLoading) {
        return <p className="text-slate-300 mt-10">Cargando horario...</p>;
    }

    if (isError) {
        return (
            <p className="text-red-400 mt-10">
                Ocurrió un error al cargar el horario.
            </p>
        );
    }

    return (
        <div className="mt-10 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">
                        Horario de atención
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Configurá los días y horarios en los que vas a recibir turnos.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={updateSchedule.isPending || !touched}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                     bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50
                     disabled:cursor-not-allowed transition"
                >
                    {updateSchedule.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
            </div>

            {/* Config básica */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Zona horaria
                    </label>
                    <input
                        type="text"
                        value={timezone}
                        onChange={(e) => {
                            setTimezone(e.target.value);
                            setTouched(true);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="America/Argentina/Buenos_Aires"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        Usá un identificador IANA válido (ej: America/Argentina/Buenos_Aires).
                    </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Buffer entre turnos (minutos)
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={bufferMinutes}
                        onChange={(e) => {
                            setBufferMinutes(Number(e.target.value) || 0);
                            setTouched(true);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        Tiempo mínimo entre un turno y el siguiente.
                    </p>
                </div>
            </div>

            {/* Tabla de días / franjas */}
            <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/60">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-3">Día</th>
                            <th className="px-4 py-3">Franjas horarias</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {WEEKDAYS_LABELS.map((day) => (
                            <tr key={day.value} className="hover:bg-slate-900/60 align-top">
                                <td className="px-4 py-3 text-slate-100 whitespace-nowrap">
                                    {day.label}
                                </td>

                                <td className="px-4 py-3">
                                    {rulesByDay[day.value].length === 0 ? (
                                        <p className="text-xs text-slate-500">
                                            Sin franjas configuradas
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {rulesByDay[day.value].map((rule, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 text-slate-100"
                                                >
                                                    <input
                                                        type="time"
                                                        value={rule.start}
                                                        onChange={(e) =>
                                                            handleChangeRange(
                                                                day.value,
                                                                index,
                                                                "start",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    />
                                                    <span className="text-slate-500 text-xs">a</span>
                                                    <input
                                                        type="time"
                                                        value={rule.end}
                                                        onChange={(e) =>
                                                            handleChangeRange(
                                                                day.value,
                                                                index,
                                                                "end",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveRange(day.value, index)
                                                        }
                                                        className="ml-2 px-2 py-1 text-[10px] rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleAddRange(day.value)}
                                            className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
                                        >
                                            Agregar franja
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {updateSchedule.isError && (
                <p className="text-red-400 text-sm">
                    Ocurrió un error al guardar el horario.
                </p>
            )}

            {updateSchedule.isSuccess && (
                <p className="text-emerald-400 text-sm">
                    Horario guardado correctamente.
                </p>
            )}
        </div>
    );
}