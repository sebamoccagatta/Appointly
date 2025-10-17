// apps/backend/src/errors/map-domain-error.ts
export function mapDomainErrorToHttp(err: any): { status: number; code: string; message?: string } {
  const code = typeof err?.message === "string" ? err.message : "INTERNAL_ERROR";

  switch (code) {
    case "USER_INVALID_EMAIL":
    case "USER_INVALID_NAME":
    case "USER_INVALID_PASSWORD":
    case "USER_INVALID_ROLE":
      return { status: 400, code };

    case "USER_EMAIL_TAKEN":
      return { status: 400, code }; // o 409 si preferís

    case "AUTH_INVALID_CREDENTIALS":
      return { status: 401, code };

    default:
      return { status: 500, code: "INTERNAL_ERROR", message: code };
  }
}
