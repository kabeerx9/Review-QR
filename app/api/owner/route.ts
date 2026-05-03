import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, autoReplyEnabled, shopId, specialties } = body;

    // Optional: Validate inputs here
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    // Update the owner record
    const updatedOwner = await prisma.owner.update({
      where: { id: session.ownerId },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        autoReplyEnabled: Boolean(autoReplyEnabled),
      },
    });

    if (shopId && typeof specialties === "string") {
      await prisma.shop.update({
        where: { id: shopId, ownerId: session.ownerId },
        data: { specialties },
      });
    }

    return NextResponse.json({ success: true, owner: updatedOwner });
  } catch (error) {
    console.error("Error updating owner:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
