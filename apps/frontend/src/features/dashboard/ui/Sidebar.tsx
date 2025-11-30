import { NavLink } from "react-router-dom";

const linkBase = "block px-3 py-2 rounded hover:bg-gray-100";
const active = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${linkBase} bg-gray-200` : linkBase;

export function Sidebar() {
    return (
        <aside className="w-56 border-r p-3 space-y-2">
            <NavLink to="/dashboard" className={active} end>Inicio</NavLink>
            <NavLink to="/dashboard/appointments" className={active}>Mis citas</NavLink>
            <NavLink to="/dashboard/offerings" className={active}>Ofertas</NavLink>
            <NavLink to="/dashboard/schedules" className={active}>Horarios</NavLink>
        </aside>
    );
}
