import { createContext, useContext, useMemo, useState } from "react";

type Role = "ADMIN" | "USER" | "ASSISTANT";
type USER = { id: string; name: string; email: string; role: Role };

type AuthState = {
    token: string | null;
    user: USER | null;
    hydrated: boolean;
    setAuth: (data: { token: string; user: USER }) => void;
    clearAuth: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function getInitialAuth() {
    try {
        const raw = localStorage.getItem("auth");
        if (!raw) return { token: null, user: null };
        return JSON.parse(raw) as { token: string | null; user: USER | null };
    } catch {
        return { token: null, user: null };
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const initial = getInitialAuth();
    const [token, setToken] = useState<string | null>(initial.token);
    const [user, setUser] = useState<USER | null>(initial.user);
    const [hydrated] = useState(true);

    const setAuth = (v: { token: string; user: USER }) => {
        setToken(v.token);
        setUser(v.user);
        localStorage.setItem("auth", JSON.stringify(v));
        localStorage.setItem("token", v.token); // si tu http lo usa
    };

    const clearAuth = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("auth");
        localStorage.removeItem("token");
    };

    const value = useMemo(() => ({ token, user, hydrated, setAuth, clearAuth }), [token, user, hydrated]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}