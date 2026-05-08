import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "signup_disabled" }, { status: 403 });
}
