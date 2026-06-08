const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

type RequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
};

export class ApiRequestError extends Error {
  status: number;
  attemptsRemaining?: number;
  retryAfterMinutes?: number;
  locked?: boolean;

  constructor(
    message: string,
    status: number,
    details: {
      attemptsRemaining?: number;
      retryAfterMinutes?: number;
      locked?: boolean;
    } = {}
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.attemptsRemaining = details.attemptsRemaining;
    this.retryAfterMinutes = details.retryAfterMinutes;
    this.locked = details.locked;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", token, body } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const backendMessage =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: string }).message)
        : "";
    const message = backendMessage || `Error en la solicitud (${response.status})`;

    throw new ApiRequestError(message, response.status, {
      attemptsRemaining:
        data && typeof data === "object" && "attemptsRemaining" in data
          ? Number((data as { attemptsRemaining?: number }).attemptsRemaining)
          : undefined,
      retryAfterMinutes:
        data && typeof data === "object" && "retryAfterMinutes" in data
          ? Number((data as { retryAfterMinutes?: number }).retryAfterMinutes)
          : undefined,
      locked:
        data && typeof data === "object" && "locked" in data
          ? Boolean((data as { locked?: boolean }).locked)
          : undefined
    });
  }

  return data as T;
}
