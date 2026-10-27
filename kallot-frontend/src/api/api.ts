
const BASE_URL = import.meta.env.VITE_API_URL;

export const TOKEN_KEY = "token";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers);

  const authToken = token ?? localStorage.getItem(TOKEN_KEY);

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  if (
    options.body !== undefined &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "לא ניתן להתחבר לשרת. בדקי שהשרת פועל ושהכתובת נכונה."
    );
  }

  if (!response.ok) {
    if (response.status === 401 && authToken) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const errorText = await response.text();

    let message = `הבקשה נכשלה: ${response.status} ${response.statusText}`;
    let code: string | undefined;
    let details: unknown;

    try {
      const body = JSON.parse(errorText);
      if (body?.error?.message) {
        message = body.error.message;
      }
      code = body?.error?.code;
      details = body?.error?.details;
    } catch {

    }

    throw new ApiError(message, response.status, code, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("השרת החזיר תשובה שאינה JSON תקין.");
  }
}