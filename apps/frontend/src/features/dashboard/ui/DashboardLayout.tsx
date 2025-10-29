import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen grid grid-rows-[auto_1fr]">
            <TopBar />
            <div className="grid grid-cols-[14rem_1fr]">
                <Sidebar />
                <main>{children}</main>
            </div>
        </div>
    );
}
