export function mapDomainErrorToHttp(err: { code: string | number; }) {
  const COMMON_ERRORS = {
    AUTH_INVALID_CREDENTIALS: {
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Email o contraseña incorrectos.",
    },
    USER_ALREADY_EXISTS: {
      status: 400,
      code: "USER_ALREADY_EXISTS",
      message: "Ya existe un usuario con ese email.",
    },
    USER_NOT_FOUND: {
      status: 404,
      code: "USER_NOT_FOUND",
      message: "El usuario no existe.",
    },
    INVALID_EMAIL_FORMAT: {
      status: 400,
      code: "INVALID_EMAIL",
      message: "El email ingresado no es válido.",
    },
    PASSWORD_TOO_SHORT: {
      status: 400,
      code: "PASSWORD_TOO_SHORT",
      message: "La contraseña es demasiado corta.",
    },

    TOKEN_INVALID: {
      status: 401,
      code: "TOKEN_INVALID",
      message: "Token inválido. Iniciá sesión nuevamente.",
    },

    TOKEN_EXPIRED: {
      status: 401,
      code: "TOKEN_EXPIRED",
      message: "Tu sesión expiró. Volvé a iniciar sesión.",
    },
  } as const;

  type CommonErrorKey = keyof typeof COMMON_ERRORS;

  // Si el error pertenece al dominio → lo mapeamos
  if (typeof err?.code === "string" && (err.code as CommonErrorKey) in COMMON_ERRORS) {
    return COMMON_ERRORS[err.code as CommonErrorKey];
  }

  // Si no, devolvemos uno genérico
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Ocurrió un error inesperado. Intentá nuevamente.",
  };
}
