import { requireSuperAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const MAX_BATCH_SIZE = 50;

export async function POST(req: NextRequest) {
  try {
    const superadmin = await requireSuperAdmin();

    const { users } = await req.json();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    if (users.length > MAX_BATCH_SIZE) {
      return NextResponse.json({ error: "batch_too_large", max: MAX_BATCH_SIZE }, { status: 400 });
    }

    const created: Array<{ name: string; email: string; temporaryPassword: string; trialEndsAt: string }> = [];
    const errors: Array<{ email?: string; index: number; error: string }> = [];

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 15);

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      const { name, email, internalNotes } = userData;

      const normalizedEmail = String(email || "").trim().toLowerCase();

      if (!normalizedEmail || !name) {
        errors.push({ index: i, error: "missing_name_or_email" });
        continue;
      }

      const existing = await prisma.owner.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        errors.push({ email: normalizedEmail, index: i, error: "email_taken" });
        continue;
      }

      try {
        const temporaryPassword = crypto.randomBytes(9).toString("base64url");
        const passwordHash = await bcrypt.hash(temporaryPassword, 12);

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
            name: true,
            email: true,
            trialEndsAt: true,
          },
        });

        created.push({
          name: user.name,
          email: user.email!,
          temporaryPassword,
          trialEndsAt: user.trialEndsAt!.toISOString(),
        });
      } catch (err) {
        errors.push({ email: normalizedEmail, index: i, error: "creation_failed" });
      }
    }

    if (created.length > 0) {
      await prisma.superAdminAuditLog.create({
        data: {
          actorId: superadmin.id,
          action: "USER_CREATED",
          metadata: { count: created.length },
        },
      });
    }

    return NextResponse.json({
      created,
      errors,
    });
  } catch (error) {
    console.error("Superadmin users bulk POST error:", error);
    return NextResponse.json({ error: "failed_to_bulk_create_users" }, { status: 500 });
  }
}
