import { createToken, setSessionCookie, getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "password_too_short" }, { status: 400 });
    }

    const owner = await prisma.owner.findUnique({ where: { id: session.ownerId } });
    if (!owner || !owner.passwordHash) {
      return NextResponse.json({ error: "owner_not_found" }, { status: 404 });
    }

    if (owner.disabledAt) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 });
    }

    const valid = await bcrypt.compare(currentPassword, owner.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "invalid_current_password" }, { status: 401 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "same_password" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.owner.update({
      where: { id: owner.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    const token = await createToken({
      ownerId: owner.id,
      email: owner.email!,
      role: owner.role,
      mustChangePassword: false,
    });

    const res = NextResponse.json({ success: true, redirectTo: "/dashboard" });
    setSessionCookie(res, token);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "change_password_failed";
    if (message === "missing_jwt_secret") {
      return NextResponse.json(
        { error: "missing_jwt_secret", message: "Set JWT_SECRET in .env.local" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "change_password_failed" }, { status: 500 });
  }
}
