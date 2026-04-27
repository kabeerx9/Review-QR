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

    const token = await createToken({ ownerId: owner.id, email: owner.email! });
    const res = NextResponse.json({ success: true });
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
