import { createContext, useContext, useMemo, useState } from "react";

type Role = "ADMIN" | "USER" | "ASSISTANT";
type USER = { id: string; name: string; email: string; role: Role };

type AuthState = {
    token: string | null;
    user: USER | null;
    setAuth: (data: { token: string; user: USER }) => void;
    clearAuth: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<USER | null>(null);

    const value = useMemo<AuthState>(() => ({
        token,
        user,
        setAuth: ({ token, user }) => {
            setToken(token);
            setUser(user);
            localStorage.setItem("token", token);
        },
        clearAuth: () => {
            setToken(null);
            setUser(null);
            localStorage.removeItem("token");
        }
    }), [token, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}