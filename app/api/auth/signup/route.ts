import { createToken, setSessionCookie } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password || password.length < 6) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const existing = await prisma.owner.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const owner = await prisma.owner.create({
      data: {
        name: String(name || "").trim(),
        email: normalizedEmail,
        passwordHash,
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        subscriptionStatus: "TRIAL",
      },
    });

    const token = await createToken({ ownerId: owner.id, email: owner.email! });
    const res = NextResponse.json({ success: true });
    setSessionCookie(res, token);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "signup_failed";
    if (message === "missing_jwt_secret") {
      return NextResponse.json(
        { error: "missing_jwt_secret", message: "Set JWT_SECRET in .env.local" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "signup_failed" }, { status: 500 });
  }
}
