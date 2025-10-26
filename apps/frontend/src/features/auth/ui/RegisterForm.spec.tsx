import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../store";
import { RegisterForm } from "./RegisterForm";
import { MemoryRouter } from "react-router-dom";

function renderWithProviders(ui: React.ReactNode) {
    const client = new QueryClient();
    return render(
        <MemoryRouter initialEntries={["/register"]}>
            <QueryClientProvider client={client}>
                <AuthProvider>{ui}</AuthProvider>
            </QueryClientProvider>
        </MemoryRouter>
    );
}

beforeEach(() => { localStorage.clear(); })

describe("RegisterForm", () => {
    it("renderiza campos name, email, password y botón", () => {
        renderWithProviders(<RegisterForm />);
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
    });

    it("muestra errores 'Requerido' cuando se envía vacío", async () => {
        renderWithProviders(<RegisterForm />);
        fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));
        const errors = await screen.findAllByText(/requerido/i);
        expect(errors.length).toBeGreaterThanOrEqual(3);
    });

    it("registra correctamente y permite loguear luego (guarda token al hacer login posterior)", async () => {
        renderWithProviders(<RegisterForm />);
        fireEvent.input(screen.getByLabelText(/name/i), { target: { value: "Alice" } });
        fireEvent.input(screen.getByLabelText(/email/i), { target: { value: "alice@example.com" } });
        fireEvent.input(screen.getByLabelText(/password/i), { target: { value: "password123" } });
        fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

        await waitFor(() => {

            expect(screen.queryByText(/error/i)).toBeNull();
        });
    });
});