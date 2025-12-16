import type { AuthResult } from "../domain/authService";

type ApiError = Error & {
  statusCode?: number;
  code?: string;
};

type ServerApiError = {
  status: number;
  message: string;
  code: string;
};

async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const data = (await res.json().catch(() => null)) as ServerApiError | null;

  if (!res.ok) {
    const message = data?.message ?? fallbackMessage;
    const err: ApiError = new Error(message);

    err.statusCode = data?.status ?? res.status;
    err.code = data?.code;

    throw err;
  }

  return data as T;
}

export async function loginRequest(email: string, password: string): Promise<AuthResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password: password.trim() }),
  });

  return handleResponse<AuthResult>(res, "Failed to sign in");
}

export async function logoutRequest(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  await handleResponse<{ message: string }>(res, "Failed to logout");
}

export async function registerRequest(email: string, password: string): Promise<AuthResult> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password: password.trim() }),
  });

  return handleResponse<AuthResult>(res, "Failed to create your account. Please try again.");
}

export async function forgotPasswordRequest(email: string): Promise<{ resetToken?: string }> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });

  // your route probably returns { message, resetToken? }
  return handleResponse<{ resetToken?: string }>(res, "Failed to send reset email");
}

export async function resetPasswordRequest(
  token: string,
  password: string,
): Promise<{ message: string }> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password: password.trim() }),
  });

  return handleResponse<{ message: string }>(res, "Failed to reset password");
}
