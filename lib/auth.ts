import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("missing_jwt_secret");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  ownerId: string;
  email: string;
  role: "USER" | "SUPERADMIN";
  mustChangePassword: boolean;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("rqr_session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(
  req: NextRequest,
): Promise<SessionPayload | null> {
  const token = req.cookies.get("rqr_session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set("rqr_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getCurrentOwner() {
  const session = await getSession();
  if (!session) return null;
  return prisma.owner.findUnique({ where: { id: session.ownerId } });
}

export async function requireOwner() {
  const owner = await getCurrentOwner();
  if (!owner || owner.disabledAt) redirect("/login");
  if (owner.role === "SUPERADMIN") redirect("/superadmin");
  if (owner.mustChangePassword) redirect("/change-password");
  return owner;
}

export async function requireSuperAdmin() {
  const owner = await getCurrentOwner();
  if (!owner || owner.disabledAt || owner.role !== "SUPERADMIN") redirect("/dashboard");
  return owner;
}

export async function requireSuperAdminFromRequest(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return null;
  const owner = await prisma.owner.findUnique({ where: { id: session.ownerId } });
  if (!owner || owner.disabledAt || owner.role !== "SUPERADMIN") return null;
  return owner;
}

export async function requireActiveUserFromRequest(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return null;
  const owner = await prisma.owner.findUnique({ where: { id: session.ownerId } });
  if (!owner || owner.disabledAt || owner.role === "SUPERADMIN" || owner.mustChangePassword) return null;
  return owner;
}
