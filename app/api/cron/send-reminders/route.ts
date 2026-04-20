import { NextResponse } from "next/server";
import { sendPickup24hReminders, sendReturnDayReminders } from "@/lib/reminders";

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-cron-secret");
  if (header === secret) return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return false;
}

async function run() {
  const [pickup, returnDay] = await Promise.all([
    sendPickup24hReminders(),
    sendReturnDayReminders(),
  ]);
  return NextResponse.json({ pickup, returnDay });
}
