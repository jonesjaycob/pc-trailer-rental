import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("sms", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("smsEnabled is false when TWILIO_* vars missing", async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_NUMBER;
    const { smsEnabled, sendSms } = await import("@/lib/sms");
    expect(smsEnabled()).toBe(false);
    const res = await sendSms({ to: "+12055550100", body: "test" });
    expect(res.skipped).toBe(true);
    expect(res.sid).toBeNull();
  });

  it("sendSms is a no-op when phone is empty", async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    const { sendSms } = await import("@/lib/sms");
    const res = await sendSms({ to: "", body: "test" });
    expect(res.skipped).toBe(true);
  });
});
