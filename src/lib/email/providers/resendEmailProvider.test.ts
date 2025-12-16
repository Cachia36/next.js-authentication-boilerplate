import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env
vi.mock("@/lib/core/env", () => ({
  RESEND_API_KEY: "test-key",
}));

// Mock Resend client
const mockSend = vi.fn();

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: (...args: any[]) => mockSend(...args),
      };
    },
  };
});

import { resendEmailProvider } from "./resendEmailProvider";

describe("resendEmailProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends password reset email via Resend", async () => {
    mockSend.mockResolvedValueOnce({ error: null });

    await resendEmailProvider.sendPasswordReset("a@b.com", "http://localhost/reset?token=123");

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Authentication App <no-reply@resend.dev>",
        to: "a@b.com",
        subject: "Reset your password",
      }),
    );

    const sent = mockSend.mock.calls[0][0];
    expect(sent.html).toContain("http://localhost/reset?token=123");
  });

  it("throws when Resend returns an error", async () => {
    const err = new Error("resend failed");
    mockSend.mockResolvedValueOnce({ error: err });

    await expect(
      resendEmailProvider.sendPasswordReset("a@b.com", "http://localhost/reset?token=123"),
    ).rejects.toBe(err);
  });
});
