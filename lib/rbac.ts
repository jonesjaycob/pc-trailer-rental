import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export async function requireUserApi() {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, response: jsonError("Unauthorized", 401) };
  }
  return { ok: true as const, user: session.user };
}

export async function requireAdminApi() {
  const res = await requireUserApi();
  if (!res.ok) return res;
  if (res.user.role !== "admin") {
    return { ok: false as const, response: jsonError("Forbidden", 403) };
  }
  return res;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
