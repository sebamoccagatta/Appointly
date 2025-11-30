// src/components/RequireRole.tsx
import { useAuth } from "../features/auth/AuthContext";

export default function RequireRole({
    roles,
    children,
}: {
    roles: Array<"ADMIN" | "ASSISTANT" | "USER">;
    children: React.ReactNode;
}) {
    const { user } = useAuth();

    if (!user) return null;
    if (!roles.includes(user.role)) return null;

    return <>{children}</>;
}
