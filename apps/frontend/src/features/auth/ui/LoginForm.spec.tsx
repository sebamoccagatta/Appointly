import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "../store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "./LoginForm";

function renderWithProviders(ui: React.ReactNode) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("LoginForm", () => {
  it("renderiza campos email y password y botón submit", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
  });

  it("muestra errores de validación cuando los campos están vacíos y se envía", async () => {
    renderWithProviders(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));
    expect(await screen.findAllByText(/requerido/i)).toHaveLength(2);
  });

  it("envía credenciales válidas, guarda token y muestra estado de éxito", async () => {
    renderWithProviders(<LoginForm />);

    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: "john@example.com" } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake.jwt.token");
    });
  });
});
