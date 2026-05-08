import { requireActiveUserFromRequest } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const owner = await requireActiveUserFromRequest(req);
    if (!owner) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const data = await getDashboardData(owner.id);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "server_error";
    const status = message === "owner_not_found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
