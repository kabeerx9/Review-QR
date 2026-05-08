import { requireSuperAdminFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const superadmin = await requireSuperAdminFromRequest(req);
    if (!superadmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const { id } = await params;

    const user = await prisma.owner.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialStartedAt: true,
        trialEndsAt: true,
        mustChangePassword: true,
        disabledAt: true,
        internalNotes: true,
        autoReplyEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        razorpayCustomerId: true,
        razorpaySubscriptionId: true,
        shops: {
          select: {
            id: true,
            name: true,
            city: true,
            niche: true,
            isActive: true,
            slug: true,
            qrCodeUrl: true,
            googleReviewUrl: true,
            googleMapsUrl: true,
            specialties: true,
          },
        },
        onboardedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        superAdminAuditTargets: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            createdAt: true,
            actor: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Superadmin user GET error:", error);
    return NextResponse.json({ error: "failed_to_fetch_user" }, { status: 500 });
  }
}
