import { requireActiveUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const owner = await requireActiveUserFromRequest(req);
  if (!owner) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const shop = await prisma.shop.findFirst({
    where: { id, ownerId: owner.id },
  });

  if (!shop) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ shop });
}
