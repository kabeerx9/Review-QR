import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
