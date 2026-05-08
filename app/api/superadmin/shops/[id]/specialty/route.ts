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
    const { specialties } = await req.json();

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return NextResponse.json({ error: "shop_not_found" }, { status: 404 });
    }

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: { specialties: String(specialties || "").trim() || null },
    });

    return NextResponse.json({ success: true, shop: updatedShop });
  } catch (error) {
    console.error("Failed to update specialty:", error);
    return NextResponse.json({ error: "failed_to_update_specialty" }, { status: 500 });
  }
}
