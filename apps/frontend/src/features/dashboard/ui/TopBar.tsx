import { useAuth } from "../../auth/store";
import { useNavigate } from "react-router-dom";

export function TopBar() {
    const { user, clearAuth } = useAuth();
    const navigate = useNavigate();

    const onLogout = () => {
        clearAuth();
        navigate("/login", { replace: true });
    };

    return (
        <header className="flex items-center justify-between border-b px-4 h-14">
            <div className="font-medium">
                {user?.name ? `Hola, ${user.name} 👋` : "Dashboard"}
            </div>
            <button
                onClick={onLogout}
                className="px-3 py-1 border rounded hover:bg-gray-100"
            >
                Cerrar sesión
            </button>
        </header>
    );
}
