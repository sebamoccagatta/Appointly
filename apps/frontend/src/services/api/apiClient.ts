const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function mapApiError(data: any): string {
  if (!data) return "Ocurrió un error inesperado.";

  if (data.message && typeof data.message === "string") {
    return data.message;
  }

  if (data.error && typeof data.error === "string") {
    switch (data.error) {
      case "AUTH_INVALID_CREDENTIALS":
        return "Email o contraseña incorrectos.";
      case "USER_ALREADY_EXISTS":
        return "Ya existe un usuario con ese email.";
      case "USER_NOT_FOUND":
        return "El usuario no existe.";
      default:
        return "Ocurrió un error: " + data.error;
    }
  }

  return "Ocurrió un error al procesar la solicitud.";
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = mapApiError(data);
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}
