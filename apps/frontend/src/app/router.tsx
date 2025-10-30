import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/store";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import MyAppointmentsPage from "../features/appointments/pages/MyAppointmentsPage";
import OfferingsPage from "../features/offerings/pages/OfferingsPage";
import SchedulesPage from "../features/schedules/pages/SchedulesPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { token, hydrated } = useAuth();
  if (!hydrated) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRouterInner() {
  const router = createBrowserRouter([
    { path: "/", element: <Navigate to="/dashboard" replace /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    {
      path: "/dashboard",
      element: (
        <Protected>
          <DashboardPage />
        </Protected>
      ),
      children: [
        { index: true, element: <div className="p-6">Bienvenido/a</div> },
        { path: "appointments", element: <MyAppointmentsPage /> },
        { path: "offerings", element: <OfferingsPage /> },
        { path: "schedules", element: <SchedulesPage /> },
      ]
    }
  ]);
  return <RouterProvider router={router} />;
}

export function AppRouter() {
  return <AppRouterInner />;
}