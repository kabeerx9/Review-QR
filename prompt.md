# Next.js + Prisma + Supabase (PostgreSQL) Setup Guide

## Goal
Set up a production-ready Next.js app with:
- Prisma ORM
- Supabase PostgreSQL
- Connection pooling (PgBouncer)
- Clean folder structure
- Example API + working UI

---

## Tech Stack
- Next.js (App Router)
- Prisma ORM
- PostgreSQL (Supabase)
- TypeScript

---

## 1. Install Dependencies

```bash
npm install prisma --save-dev
npm install @prisma/client
2. Initialize Prisma
npx prisma init
3. Configure Environment Variables

Create/update .env.local:

# Pooled connection (used by app)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"

# Direct connection (used for migrations)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

⚠️ Replace with your Supabase credentials.

4. Configure Prisma Schema

Update prisma/schema.prisma:

generator client {
  provider = "prisma-client"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
5. Generate Prisma Client
npx prisma generate
6. Push Schema to Database
npx prisma db push
7. Create Prisma Singleton

Create lib/prisma.ts:

import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
8. Create API Route

Create app/api/users/route.ts:

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.user.findMany()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
9. Use in Server Component

Update app/page.tsx:

import prisma from "@/lib/prisma"

export default async function Home() {
  let users = []

  try {
    users = await prisma.user.findMany()
  } catch (e) {
    console.error(e)
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Users</h1>

      {users.length === 0 ? (
        <p>No users yet</p>
      ) : (
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              {u.email} - {u.name}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
10. Add Scripts

Update package.json:

{
  "scripts": {
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  }
}
11. Verify Setup

Run:

npm run dev

Test:

Open homepage → should show users
POST to /api/users
Verify in UI
Best Practices
Always use pooled connection in app
Always use direct connection for migrations
Never create multiple Prisma clients
Wrap DB calls in try/catch
Avoid calling Prisma in client components
Optional Improvements (DO NOT IMPLEMENT NOW)
Add Zod validation
Add logging layer
Add repository pattern
Add auth (NextAuth / Supabase Auth)
Add pagination
Expected Result
Working Next.js app
Connected to Supabase Postgres
API routes working
Data visible in UI
