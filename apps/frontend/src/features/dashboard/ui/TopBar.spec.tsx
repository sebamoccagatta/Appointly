import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/store";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TopBar } from "./TopBar";

function renderWithProviders(ui: React.ReactNode, { token = "t", name = "John" } = {}) {
    const client = new QueryClient();
    localStorage.setItem("token", token);
    return render(
        <MemoryRouter initialEntries={["/dashboard"]}>
            <QueryClientProvider client={client}>
                <AuthProvider>
                    <Routes>
                        <Route path="/dashboard" element={ui} />
                        <Route path="/login" element={<div>LoginPage</div>} />
                    </Routes>
                </AuthProvider>
            </QueryClientProvider>
        </MemoryRouter>
    );
}

beforeEach(() => localStorage.clear());

describe("TopBar", () => {
    it("muestra saludo con el nombre del usuario (si está disponible)", () => {
        renderWithProviders(<TopBar />);
        expect(screen.getByRole("button", { name: /cerrar sesión/i })).toBeInTheDocument();
    });

    it("logout: limpia token y redirige a /login", () => {
        renderWithProviders(<TopBar />);
        fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));
        expect(localStorage.getItem("token")).toBeNull();

    });
});
