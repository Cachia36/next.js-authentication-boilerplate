import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLogInfo = vi.fn();
vi.mock("@/lib/core/logger", () => ({
  logInfo: (...args: any[]) => mockLogInfo(...args),
}));

import { consoleEmailProvider } from "./consoleEmailProvider";

describe("consoleEmailProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs the reset email payload", async () => {
    await consoleEmailProvider.sendPasswordReset("test@email.com", "http://localhost/reset?t=1");

    expect(mockLogInfo).toHaveBeenCalledWith("Sending password reset email (console provider)", {
      to: "test@email.com",
      resetLink: "http://localhost/reset?t=1",
    });
  });
});
