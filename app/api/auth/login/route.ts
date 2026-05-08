import { createToken, setSessionCookie } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const owner = await prisma.owner.findUnique({ where: { email: normalizedEmail } });
    if (!owner || !owner.passwordHash) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, owner.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    if (owner.disabledAt) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 });
    }

    await prisma.owner.update({
      where: { id: owner.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await createToken({
      ownerId: owner.id,
      email: owner.email!,
      role: owner.role,
      mustChangePassword: owner.mustChangePassword,
    });

    let redirectTo = "/dashboard";
    if (owner.role === "SUPERADMIN") {
      redirectTo = "/superadmin";
    } else if (owner.mustChangePassword) {
      redirectTo = "/change-password";
    }

    const res = NextResponse.json({
      success: true,
      role: owner.role,
      mustChangePassword: owner.mustChangePassword,
      redirectTo,
    });
    setSessionCookie(res, token);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "login_failed";
    if (message === "missing_jwt_secret") {
      return NextResponse.json(
        { error: "missing_jwt_secret", message: "Set JWT_SECRET in .env.local" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "login_failed" }, { status: 500 });
  }
}
