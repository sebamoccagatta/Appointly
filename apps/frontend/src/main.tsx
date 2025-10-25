import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AppProviders } from "./app/providers";
import { AuthProvider } from "./features/auth/store";
import { AppRouter } from "./app/router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </AppProviders>
  </React.StrictMode>
);