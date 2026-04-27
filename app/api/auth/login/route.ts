import { createToken, setSessionCookie } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const owner = await prisma.owner.findUnique({ where: { email } });
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
}
