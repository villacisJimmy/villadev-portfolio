import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { status: "ok", uptime: process.uptime(), ts: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
