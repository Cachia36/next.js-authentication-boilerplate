import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AuthResult } from "../domain/authService";
import {
  loginRequest,
  registerRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
} from "./authClient";

const globalAny = globalThis as any;

describe("authClient", () => {
  beforeEach(() => {
    globalAny.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loginRequest trims email and password before sending", async () => {
    const fakeResult: AuthResult = {
      user: { id: "1", email: "test@example.com" } as any,
      accessToken: "token",
      refreshToken: "refresh",
    };

    (globalAny.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(fakeResult),
    } as unknown as Response);

    await loginRequest("  test@example.com  ", "  Password1  ");

    expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    const [, options] = (globalAny.fetch as any).mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body).toEqual({
      email: "test@example.com",
      password: "Password1",
    });
  });

  it("registerRequest trims email and password before sending", async () => {
    const fakeResult: AuthResult = {
      user: { id: "1", email: "test@example.com" } as any,
      accessToken: "token",
      refreshToken: "refresh",
    };

    (globalAny.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(fakeResult),
    } as unknown as Response);

    await registerRequest("  user@example.com  ", "  Password1  ");

    const [, options] = (globalAny.fetch as any).mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body).toEqual({
      email: "user@example.com",
      password: "Password1",
    });
  });

  it("forgotPasswordRequest trims email", async () => {
    (globalAny.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    await forgotPasswordRequest("  test@example.com  ");

    const [, options] = (globalAny.fetch as any).mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body).toEqual({ email: "test@example.com" });
  });

  it("resetPasswordRequest trims password", async () => {
    (globalAny.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ message: "ok" }),
    } as unknown as Response);

    await resetPasswordRequest("token123", "  Password1  ");

    const [, options] = (globalAny.fetch as any).mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body).toEqual({ token: "token123", password: "Password1" });
  });
});
