import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../ui/DashboardLayout";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
}
