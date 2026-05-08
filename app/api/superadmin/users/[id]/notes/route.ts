import { requireSuperAdminFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const superadmin = await requireSuperAdminFromRequest(req);
    if (!superadmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const { id } = await params;

    const { internalNotes } = await req.json();

    if (typeof internalNotes !== "string") {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const user = await prisma.owner.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    await prisma.owner.update({
      where: { id },
      data: { internalNotes },
    });

    await prisma.superAdminAuditLog.create({
      data: {
        actorId: superadmin.id,
        targetOwnerId: id,
        action: "USER_NOTES_UPDATED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Superadmin user notes PATCH error:", error);
    return NextResponse.json({ error: "failed_to_update_notes" }, { status: 500 });
  }
}
