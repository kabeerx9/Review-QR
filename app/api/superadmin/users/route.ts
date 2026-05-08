import { requireSuperAdminFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Niche } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const superadmin = await requireSuperAdminFromRequest(req);
    if (!superadmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const subscriptionStatus = searchParams.get("subscriptionStatus") || "";
    const role = searchParams.get("role") || "";
    const disabled = searchParams.get("disabled") || "";
    const mustChangePassword = searchParams.get("mustChangePassword") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    const searchConditions = [];
    if (q) {
      searchConditions.push(
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } }
      );
    }

    const filterConditions = [];
    if (subscriptionStatus && subscriptionStatus !== "all") {
      filterConditions.push({ subscriptionStatus });
    }

    if (role && role !== "all") {
      filterConditions.push({ role });
    }

    if (disabled === "true") {
      filterConditions.push({ disabledAt: { not: null } });
    } else if (disabled === "false") {
      filterConditions.push({ disabledAt: null });
    }

    if (mustChangePassword === "true") {
      filterConditions.push({ mustChangePassword: true });
    } else if (mustChangePassword === "false") {
      filterConditions.push({ mustChangePassword: false });
    }

    if (searchConditions.length > 0 && filterConditions.length > 0) {
      where.AND = [
        { OR: searchConditions },
        ...filterConditions,
      ];
    } else if (searchConditions.length > 0) {
      where.OR = searchConditions;
    } else if (filterConditions.length > 0) {
      Object.assign(where, ...filterConditions);
    }

    const [users, total, trialCount, activeCount, expiredCount, cancelledCount, disabledCount] = await Promise.all([
      prisma.owner.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          trialStartedAt: true,
          trialEndsAt: true,
          mustChangePassword: true,
          disabledAt: true,
          internalNotes: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          _count: {
            select: { shops: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.owner.count({ where }),
      prisma.owner.count({ where: { subscriptionStatus: "TRIAL" } }),
      prisma.owner.count({ where: { subscriptionStatus: "ACTIVE" } }),
      prisma.owner.count({ where: { subscriptionStatus: "EXPIRED" } }),
      prisma.owner.count({ where: { subscriptionStatus: "CANCELLED" } }),
      prisma.owner.count({ where: { disabledAt: { not: null } } }),
    ]);

    const totalAll = trialCount + activeCount + expiredCount + cancelledCount;

    return NextResponse.json({
      users: users.map(({ _count, ...u }) => ({
        ...u,
        shopsCount: _count.shops,
      })),
      total,
      page,
      pageSize,
      currentSuperAdminId: superadmin.id,
      stats: {
        total: totalAll,
        trial: trialCount,
        active: activeCount,
        expired: expiredCount,
        cancelled: cancelledCount,
        disabled: disabledCount,
      },
    });
  } catch (error) {
    console.error("Superadmin users GET error:", error);
    return NextResponse.json({ error: "failed_to_fetch_users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const superadmin = await requireSuperAdminFromRequest(req);
    if (!superadmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { name, email, internalNotes, city, niche, customNiche, specialties, googleReviewUrl, googleMapsUrl } = await req.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !name) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const existing = await prisma.owner.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }

    const temporaryPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 15);

    const user = await prisma.owner.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: "USER",
        mustChangePassword: true,
        subscriptionStatus: "TRIAL",
        trialStartedAt: new Date(),
        trialEndsAt,
        internalNotes: String(internalNotes || "").trim(),
        onboardedById: superadmin.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        trialEndsAt: true,
      },
    });

    // Create shop if onboarding data is provided
    if (city && niche) {
      const { nanoid } = await import("nanoid");
      const { generateQRDataURL } = await import("@/lib/qrcode");
      const slug = nanoid(8);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const qrUrl = `${baseUrl}/r/${slug}`;
      const qrCodeUrl = await generateQRDataURL(qrUrl);

      await prisma.shop.create({
        data: {
          ownerId: user.id,
          name: String(name).trim(),
          city: String(city).trim(),
          niche: String(niche).trim().toUpperCase() as Niche,
          specialties: String(specialties || "").trim() || (niche === "OTHER" && customNiche ? String(customNiche).trim() : null),
          googleReviewUrl: String(googleReviewUrl || "").trim(),
          googleMapsUrl: String(googleMapsUrl || "").trim(),
          slug,
          qrCodeUrl,
          isActive: true,
        },
      });
    }

    await prisma.superAdminAuditLog.create({
      data: {
        actorId: superadmin.id,
        targetOwnerId: user.id,
        action: "USER_CREATED",
      },
    });

    return NextResponse.json({
      success: true,
      user,
      temporaryPassword,
    });
  } catch (error) {
    console.error("Superadmin users POST error:", error);
    return NextResponse.json({ error: "failed_to_create_user" }, { status: 500 });
  }
}
