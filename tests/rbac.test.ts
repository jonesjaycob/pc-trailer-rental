import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { requireUserApi, requireAdminApi } = await import("@/lib/rbac");

describe("requireUserApi", () => {
  beforeEach(() => authMock.mockReset());

  it("returns 401 when no session", async () => {
    authMock.mockResolvedValue(null);
    const res = await requireUserApi();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(401);
  });

  it("returns user when authenticated", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "customer" } });
    const res = await requireUserApi();
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.user.id).toBe("u1");
  });
});

describe("requireAdminApi", () => {
  beforeEach(() => authMock.mockReset());

  it("returns 401 when no session", async () => {
    authMock.mockResolvedValue(null);
    const res = await requireAdminApi();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "customer" } });
    const res = await requireAdminApi();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(403);
  });

  it("allows admin users", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "admin" } });
    const res = await requireAdminApi();
    expect(res.ok).toBe(true);
  });
});
