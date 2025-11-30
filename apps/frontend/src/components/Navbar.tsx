import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../features/auth/AuthContext";

type NavbarUser = {
  name?: string;
  email?: string;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* NAVBAR */}
      <nav
        className="
          fixed top-0 inset-x-0 z-50
          backdrop-blur-xl
          bg-slate-900/60
          border-b border-slate-800/40 
          shadow-[0_0_40px_rgba(0,0,0,0.25)]
        "
      >
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-center shadow-inner">
              <span className="text-sm font-bold text-slate-100 tracking-tight">
                A
              </span>
            </div>

            <h1 className="text-lg font-semibold text-slate-100">
              Appointly
            </h1>
          </div>

          {/* LINKS (desktop) */}
          <div className="hidden md:flex items-center gap-8 text-slate-300 text-sm">
            <Link className="hover:text-white transition" to="/">
              Inicio
            </Link>

            {user && (
              <Link className="hover:text-white transition" to="/dashboard">
                Dashboard
              </Link>
            )}
          </div>

          {/* ACTIONS (desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {!user ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="
                    px-4 py-2 text-sm rounded-lg 
                    bg-linear-to-r from-blue-600 to-indigo-500
                    hover:from-blue-500 hover:to-indigo-400 
                    text-white 
                    shadow-[0_10px_20px_rgba(37,99,235,0.35)]
                    transition
                  "
                >
                  Iniciar sesión
                </button>

                <button
                  onClick={() => navigate("/register")}
                  className="
                    px-4 py-2 text-sm rounded-lg 
                    border border-slate-700 
                    text-slate-300 
                    hover:bg-slate-800/60 hover:text-white
                    transition
                  "
                >
                  Registrarse
                </button>
              </>
            ) : (
              <UserMenu user={user} logout={logout} />
            )}
          </div>

          {/* HAMBURGER (mobile) */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-slate-700 text-slate-200"
            onClick={() => setOpen(true)}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ☰
            </motion.div>
          </button>
        </div>
      </nav>

      {/* OVERLAY MOBILE MENU */}
      <AnimatePresence>
        {open && (
          <>
            {/* Fondo oscurecido */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              className="
                fixed top-0 right-0 h-full w-72 z-50
                bg-slate-900/90 
                border-l border-slate-700/40
                shadow-[-10px_0_30px_rgba(0,0,0,0.25)]
                backdrop-blur-xl 
                p-6 flex flex-col
              "
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              {/* Close button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-white transition text-xl"
                >
                  ✕
                </button>
              </div>

              {/* User info (si está logueado) */}
              {user && (
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="
                      w-12 h-12 rounded-full 
                      bg-linear-to-br from-blue-600 to-indigo-500
                      text-white font-semibold text-lg 
                      flex items-center justify-center
                      border border-slate-800/60
                    "
                  >
                    {user.name?.slice(0, 1)?.toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
              )}

              {/* NAV LINKS */}
              <div className="flex flex-col text-slate-200 text-base gap-4">
                <Link
                  onClick={() => setOpen(false)}
                  className="hover:text-white transition"
                  to="/"
                >
                  Inicio
                </Link>

                {user && (
                  <Link
                    onClick={() => setOpen(false)}
                    className="hover:text-white transition"
                    to="/dashboard"
                  >
                    Dashboard
                  </Link>
                )}
              </div>

              {/* Actions mobile */}
              <div className="mt-auto pt-6">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                      className="
                        w-full py-2 rounded-lg text-white 
                        bg-red-600/80 hover:bg-red-500 transition
                      "
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        navigate("/login");
                        setOpen(false);
                      }}
                      className="
                        w-full py-2 rounded-lg text-white 
                        bg-linear-to-r from-blue-600 to-indigo-500
                        hover:from-blue-500 hover:to-indigo-400 transition
                      "
                    >
                      Iniciar sesión
                    </button>

                    <button
                      onClick={() => {
                        navigate("/register");
                        setOpen(false);
                      }}
                      className="
                        w-full py-2 rounded-lg 
                        border border-slate-700 
                        text-slate-300 
                        hover:bg-slate-800/60 hover:text-white 
                        transition
                      "
                    >
                      Registrarse
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- UserMenu (desktop) ---------- */

function UserMenu({ user, logout }: { user: NavbarUser; logout: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // cerrar al clickear fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = user.name?.slice(0, 1)?.toUpperCase() ?? "U";

  return (
    <div className="relative" ref={menuRef}>
      {/* AVATAR BUTTON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
          w-10 h-10 rounded-full 
          bg-linear-to-br from-blue-600 to-indigo-500
          flex items-center justify-center 
          text-white font-semibold 
          shadow-md shadow-blue-500/20
          border border-slate-800/60
          hover:scale-105 transition
        "
      >
        {initial}
      </button>

      {/* DROPDOWN */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.12 }}
            className="
              absolute right-0 mt-3 w-56 
              rounded-xl overflow-hidden 
              bg-slate-900/95 
              border border-slate-700/50 
              backdrop-blur-xl 
              shadow-xl shadow-black/30
              z-50
            "
          >
            <div className="p-3 border-b border-slate-700/40">
              <p className="text-sm font-semibold text-white">
                {user.name}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>

            <div className="py-2 flex flex-col text-sm text-slate-300">
              <button className="px-4 py-2 text-left hover:bg-slate-800/70 transition">
                Mi perfil
              </button>

              <button className="px-4 py-2 text-left hover:bg-slate-800/70 transition">
                Configuración
              </button>

              <button
                onClick={logout}
                className="
                  px-4 py-2 text-left text-red-400 
                  hover:bg-red-500/10  
                  transition
                "
              >
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
