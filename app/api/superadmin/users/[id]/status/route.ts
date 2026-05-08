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

    const { disabled } = await req.json();

    if (typeof disabled !== "boolean") {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const user = await prisma.owner.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    if (id === superadmin.id) {
      return NextResponse.json({ error: "cannot_disable_self" }, { status: 400 });
    }

    const action = disabled ? "USER_DISABLED" : "USER_ENABLED";

    if (disabled) {
      await prisma.owner.update({
        where: { id },
        data: { disabledAt: new Date() },
      });

      await prisma.shop.updateMany({
        where: { ownerId: id },
        data: { isActive: false },
      });
    } else {
      await prisma.owner.update({
        where: { id },
        data: { disabledAt: null },
      });
    }

    await prisma.superAdminAuditLog.create({
      data: {
        actorId: superadmin.id,
        targetOwnerId: id,
        action,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Superadmin user status PATCH error:", error);
    return NextResponse.json({ error: "failed_to_update_status" }, { status: 500 });
  }
}
