import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api/apiClient";

export default function RegisterPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [localError, setLocalError] = useState("");
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = () => {
        if (name.trim().length < 2) return "El nombre es demasiado corto.";
        if (!email.includes("@")) return "El email no es válido.";
        if (password.length < 6)
            return "La contraseña debe tener al menos 6 caracteres.";
        if (password !== passwordConfirm)
            return "Las contraseñas no coinciden.";
        return "";
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setServerError("");

        const err = validate();
        if (err) {
            setLocalError(err);
            return;
        }

        setLocalError("");
        setLoading(true);

        try {
            await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    // role: "USER" // si quisieras enviarlo explícito
                }),
            });

            // Podríamos auto-loguear, pero por ahora te mando a login
            navigate("/login");
        } catch (error: any) {
            setServerError(error?.message || "Ocurrió un error al registrarse.");
        } finally {
            setLoading(false);
        }
    };

    const globalError = localError || serverError;

    return (
        <div
            className="
        w-full max-w-5xl 
        bg-slate-900/80 
        border border-slate-700/80 
        rounded-3xl 
        shadow-[0_0_60px_rgba(37,99,235,0.45)]
        overflow-hidden 
        backdrop-blur
        text-slate-100
      "
        >
            <div className="flex flex-col md:flex-row">
                {/* PANEL IZQUIERDO (branding / marketing) */}
                <div
                    className="
            relative 
            md:w-1/2 
            bg-linear-to-br from-indigo-500 via-blue-600 to-sky-400
            p-8 md:p-10 
            flex flex-col 
            justify-between
          "
                >
                    {/* Glows decorativos */}
                    <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
                        <div className="absolute -top-24 -right-16 w-48 h-48 rounded-full bg-blue-300 blur-3xl" />
                        <div className="absolute bottom-0 -left-10 w-56 h-56 rounded-full bg-indigo-400 blur-3xl" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900/20 border border-white/20 flex items-center justify-center">
                                <span className="text-xl font-bold tracking-tight">A</span>
                            </div>
                            <div className="leading-tight">
                                <p className="text-xs uppercase tracking-[0.2em] text-blue-100/80">
                                    Comenzá gratis
                                </p>
                                <p className="text-sm text-blue-50/90">Appointly</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
                                Crea tu cuenta
                                <span className="block text-blue-100/90">
                                    y ordená tu agenda.
                                </span>
                            </h2>
                            <p className="mt-3 text-sm md:text-base text-blue-100/80 max-w-md">
                                En minutos podés tener tu panel de citas listo para usar, con
                                turnos, recordatorios y asistentes gestionando por vos.
                            </p>
                        </div>

                        <ul className="space-y-2 text-sm text-blue-50/90">
                            <li className="flex items-start gap-2">
                                <span className="mt-[3px] h-4 w-4 rounded-full bg-emerald-400/90 flex items-center justify-center text-[10px] font-bold">
                                    ✓
                                </span>
                                Registro rápido, sin tarjeta de crédito.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-[3px] h-4 w-4 rounded-full bg-emerald-400/90 flex items-center justify-center text-[10px] font-bold">
                                    ✓
                                </span>
                                Ideal para profesionales y asistentes.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-[3px] h-4 w-4 rounded-full bg-emerald-400/90 flex items-center justify-center text-[10px] font-bold">
                                    ✓
                                </span>
                                Pensado para crecer con tu agenda.
                            </li>
                        </ul>
                    </div>

                    <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3 text-xs text-blue-100/80">
                        <div className="flex -space-x-2">
                            <div className="w-7 h-7 rounded-full bg-blue-300/90 border border-white/40" />
                            <div className="w-7 h-7 rounded-full bg-indigo-300/90 border border-white/40" />
                            <div className="w-7 h-7 rounded-full bg-sky-300/90 border border-white/40" />
                        </div>
                        <p>Cientos de citas gestionadas cada semana.</p>
                    </div>
                </div>

                {/* PANEL DERECHO (form) */}
                <div className="md:w-1/2 bg-slate-950/80 p-8 md:p-10 flex items-center">
                    <div className="w-full">
                        {/* Encabezado */}
                        <div className="mb-6">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                                Crear cuenta
                            </p>
                            <h1 className="text-2xl font-bold text-white mt-2">
                                Registrate en Appointly
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">
                                Combina tu agenda, tus asistentes y tus clientes en un solo lugar.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                                    Nombre
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 text-xs">
                                        👤
                                    </span>
                                    <input
                                        type="text"
                                        value={name}
                                        placeholder="Ej: Ana Martínez"
                                        onChange={(e) => setName(e.target.value)}
                                        className="
                      w-full pl-8 pr-3 py-2.5 
                      rounded-lg 
                      bg-slate-900/60 
                      border border-slate-700 
                      text-slate-100 text-sm
                      placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-400
                      transition
                    "
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 text-sm">
                                        @
                                    </span>
                                    <input
                                        type="email"
                                        value={email}
                                        autoComplete="email"
                                        placeholder="tu@email.com"
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="
                      w-full pl-8 pr-3 py-2.5 
                      rounded-lg 
                      bg-slate-900/60 
                      border border-slate-700 
                      text-slate-100 text-sm
                      placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-400
                      transition
                    "
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 text-xs">
                                        🔒
                                    </span>
                                    <input
                                        type="password"
                                        value={password}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="
                      w-full pl-8 pr-3 py-2.5 
                      rounded-lg 
                      bg-slate-900/60 
                      border border-slate-700 
                      text-slate-100 text-sm
                      placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-400
                      transition
                    "
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                                    Confirmar contraseña
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 text-xs">
                                        🔁
                                    </span>
                                    <input
                                        type="password"
                                        value={passwordConfirm}
                                        autoComplete="new-password"
                                        placeholder="Repetí tu contraseña"
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="
                      w-full pl-8 pr-3 py-2.5 
                      rounded-lg 
                      bg-slate-900/60 
                      border border-slate-700 
                      text-slate-100 text-sm
                      placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-400
                      transition
                    "
                                    />
                                </div>
                            </div>

                            {/* Errores */}
                            {globalError && (
                                <div className="bg-red-500/15 border border-red-500/70 text-red-300 text-xs px-3 py-2.5 rounded-lg">
                                    {globalError}
                                </div>
                            )}

                            {/* Botón principal */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="
                  w-full py-2.5 mt-1
                  rounded-lg 
                  bg-linear-to-r from-blue-500 to-indigo-500
                  hover:from-blue-400 hover:to-indigo-400
                  disabled:from-blue-500/60 disabled:to-indigo-500/60
                  disabled:cursor-not-allowed
                  text-sm font-semibold text-white
                  shadow-[0_15px_30px_rgba(37,99,235,0.35)]
                  transition
                "
                            >
                                {loading ? "Creando cuenta..." : "Crear cuenta"}
                            </button>
                        </form>

                        {/* Footer */}
                        <p className="mt-4 text-[11px] text-center text-slate-500">
                            ¿Ya tenés una cuenta?{" "}
                            <button
                                type="button"
                                className="text-blue-400 hover:text-blue-300 font-medium transition"
                                onClick={() => navigate("/login")}
                            >
                                Iniciar sesión
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
