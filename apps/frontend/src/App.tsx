import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.js";
import { AuthProvider } from "./features/auth/AuthContext.js";
import LoginPage from "./features/auth/LoginPage.js";
import RegisterPage from "./features/auth/RegisterPage.js";
import RequireRole from "./components/RequireRole.js";
import DashboardPage from "./features/dashboard/DashboardPage.js";
import UserManagementPage from "./features/user-management/pages/UserManagementPage.js";
import OfferingListPage from "./features/offerings/pages/OfferingListPage.js";
import OfferingEditPage from "./features/offerings/pages/OfferingEditPage.js";
import SchedulePage from "./features/schedule/pages/SchedulePage.js";
import AppointmentBookingPage from "./features/appointments/pages/AppointmentBookingPage.js";
import CustomersListPage from "./features/customers/pages/CustomersListPage.js";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* LOGIN con navbar y contenido centrado */}
          <Route
            path="/login"
            element={
              <>
                <Navbar />
                {/* fondo full width + centrado */}
                <div className="pt-16 min-h-[calc(100vh-4rem)] bg-slate-900 flex items-center justify-center">
                  <LoginPage />
                </div>
              </>
            }
          />

          <Route
            path="/register"
            element={
              <>
                <Navbar />
                <div className="pt-16 min-h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center">
                  <RegisterPage />
                </div>
              </>
            }
          />

          <Route
            path="/dashboard"
            element={
              <>
                <Navbar />
                <div className="pt-16 min-h-[calc(100vh-4rem)] bg-slate-950">
                  <DashboardPage />
                </div>
              </>
            }
          />

          <Route
            path="/admin/users"
            element={
              <>
                <Navbar />
                <div className="pt-16 min-h-[calc(100vh-4rem)] bg-slate-950">
                  <RequireRole roles={["ADMIN", "ASSISTANT"]}>
                    <UserManagementPage />
                  </RequireRole>
                </div>
              </>
            }
          />

          <Route
            path="/admin/offerings"
            element={
              <RequireRole roles={["ADMIN", "ASSISTANT"]}>
                <Navbar />
                <div className="pt-16 bg-slate-950 min-h-screen p-6">
                  <OfferingListPage />
                </div>
              </RequireRole>
            }
          />

          <Route
            path="/admin/offerings/:id"
            element={
              <RequireRole roles={["ADMIN", "ASSISTANT"]}>
                <Navbar />
                <div className="pt-16 bg-slate-950 min-h-screen p-6">
                  <OfferingEditPage />
                </div>
              </RequireRole>
            }
          />

          <Route
            path="/admin/schedule"
            element={
              <>
                <Navbar />
                <div className="pt-16 bg-slate-950 min-h-screen p-6">
                  <SchedulePage />
                </div>
              </>
            }
          />

          <Route
            path="/admin/appointments/new"
            element={
              <>
                <Navbar />
                <div className="pt-16 bg-slate-950 min-h-screen p-6">
                  <AppointmentBookingPage />
                </div>
              </>
            }
          />

          <Route
            path="/admin/customers"
            element={
              <>
                <Navbar />
                <div className="pt-16 bg-slate-950 min-h-screen p-6">
                  <CustomersListPage />
                </div>
              </>
            }
          />

          <Route
            path="*"
            element={
              <>
                <Navbar />
                <div className="pt-16 min-h-[calc(100vh-4rem)]">
                </div>
              </>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
