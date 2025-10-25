import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/store";

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginPage() { return <div className="p-6 bg-amber-600">Login Page</div>; }
function DashboardPage() { return <div className="p-6">Dashboard</div>; }

function AppRouterInner() {
  const router = createBrowserRouter([
    { path: "/", element: <Navigate to="/dashboard" replace /> },
    { path: "/login", element: <LoginPage /> },
    {
      path: "/dashboard",
      element: (
        <Protected>
          <DashboardPage />
        </Protected>
      )
    }
  ]);
  return <RouterProvider router={router} />;
}

export function AppRouter() {
  return <AppRouterInner />;
}