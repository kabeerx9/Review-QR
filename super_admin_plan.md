# Superadmin Implementation Plan

## Context and scope

This project is a Next.js 16.2.4 App Router application using Prisma/Postgres, JWT cookies in `lib/auth.ts`, and Razorpay subscription fields on the `Owner` model. The project root `AGENTS.md` says this Next.js version has breaking changes, so before implementing code, read the relevant local docs under `node_modules/next/dist/docs/`, especially:

- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`

The requested MVP is:

- Remove public signup temporarily.
- Add superadmin login/access using the existing login page/session cookie flow.
- Superadmin can list/search/filter users.
- Superadmin can create/onboard users.
- On onboarding, backend generates a temporary password and returns it once for the superadmin to manually share.
- New users start with a 15-day trial and can subscribe themselves later through the normal billing flow.
- New onboarded users must change password on first login.
- Superadmin can disable/soft-delete users.
- Superadmin can add/edit notes for users.
- Superadmin can bulk onboard users.
- No superadmin password reset flow for users right now.
- No plan management or manual subscription override in superadmin right now.
- Keep session/security work simple for now.

## Current code to account for

- Prisma schema: `prisma/schema.prisma`
- Seed script: `prisma/seed.ts`
- Auth helpers: `lib/auth.ts`
- Login API: `app/api/auth/login/route.ts`
- Public signup API to disable: `app/api/auth/signup/route.ts`
- Public signup page to remove or redirect: `app/(auth)/signup/page.tsx`
- Proxy route guards: `proxy.ts`
- Dashboard entry: `app/(dashboard)/dashboard/page.tsx`
- Billing/subscription display: `app/(dashboard)/billing/page.tsx`
- User menu: `components/UserMenu.tsx`

Current session payload only contains `{ ownerId, email }`. It does not contain role. Server-side route handlers/pages should fetch the current owner from the database when role/flags are needed.

## Data model changes

Update `prisma/schema.prisma`.

Add an owner role enum:

```prisma
enum OwnerRole {
  USER
  SUPERADMIN
}
```

Add fields to `Owner`:

```prisma
role               OwnerRole @default(USER)
mustChangePassword Boolean   @default(false)
disabledAt         DateTime?
internalNotes      String    @default("")
onboardedById      String?
onboardedBy        Owner?    @relation("OwnerOnboardedBy", fields: [onboardedById], references: [id], onDelete: SetNull)
onboardedOwners    Owner[]   @relation("OwnerOnboardedBy")
lastLoginAt        DateTime?
```

Add useful indexes:

```prisma
@@index([role])
@@index([subscriptionStatus])
@@index([disabledAt])
@@index([createdAt])
```

Add a lightweight audit log model:

```prisma
enum SuperAdminAuditAction {
  USER_CREATED
  USERS_BULK_CREATED
  USER_DISABLED
  USER_ENABLED
  USER_NOTES_UPDATED
}

model SuperAdminAuditLog {
  id          String                @id @default(cuid())
  actor       Owner                 @relation("SuperAdminAuditActor", fields: [actorId], references: [id], onDelete: Cascade)
  actorId     String
  targetOwner Owner?                @relation("SuperAdminAuditTarget", fields: [targetOwnerId], references: [id], onDelete: SetNull)
  targetOwnerId String?
  action      SuperAdminAuditAction
  metadata    Json?
  createdAt   DateTime              @default(now())

  @@index([actorId])
  @@index([targetOwnerId])
  @@index([action])
  @@index([createdAt])
}
```

Also add the inverse relation fields on `Owner`:

```prisma
superAdminAuditActions SuperAdminAuditLog[] @relation("SuperAdminAuditActor")
superAdminAuditTargets SuperAdminAuditLog[] @relation("SuperAdminAuditTarget")
```

Run:

```bash
npm run db:generate
npm run db:push
```

## Auth and authorization helpers

Extend `lib/auth.ts` with database-backed helpers. Keep JWT payload small.

Recommended helpers:

```ts
export async function getCurrentOwner() {
  const session = await getSession();
  if (!session) return null;
  return prisma.owner.findUnique({ where: { id: session.ownerId } });
}

export async function requireOwner() {
  const owner = await getCurrentOwner();
  if (!owner || owner.disabledAt) redirect("/login");
  return owner;
}

export async function requireSuperAdmin() {
  const owner = await getCurrentOwner();
  if (!owner || owner.disabledAt || owner.role !== "SUPERADMIN") redirect("/dashboard");
  return owner;
}
```

For route handlers, also add a request-based helper that returns JSON-friendly unauthorized/forbidden handling instead of calling `redirect()`. Do not trust the client or route path alone for superadmin access.

Important behavior:

- Disabled owners must not be able to log in.
- Superadmins must not accidentally enter normal onboarding/billing flows unless explicitly allowed.
- Normal users with `mustChangePassword = true` must be forced to `/change-password` before accessing `/dashboard`, `/onboarding`, `/billing`, `/settings`, Google Business, or shop APIs.

## Login changes

Update `app/api/auth/login/route.ts`.

After password verification:

- Reject if `owner.disabledAt` is set.
- Set `lastLoginAt = new Date()`.
- Create the same JWT cookie.
- Return JSON with enough routing information:

```json
{
  "success": true,
  "role": "SUPERADMIN",
  "mustChangePassword": false,
  "redirectTo": "/superadmin"
}
```

Routing rules:

- `SUPERADMIN` -> `/superadmin`
- normal user with `mustChangePassword` -> `/change-password`
- normal user without `mustChangePassword` -> `/dashboard`

Update `app/(auth)/login/page.tsx` to honor `data.redirectTo` instead of always pushing `/dashboard`. Remove the "Sign up free" link or replace it with a neutral "Need access? Contact ReviewQR."

## Disable public signup

Do both frontend and backend.

Frontend:

- Remove public navigation to `/signup`.
- Either delete `app/(auth)/signup/page.tsx` or change it to redirect to `/login`.

Backend:

- Change `app/api/auth/signup/route.ts` to return `404` or `403` with `{ error: "signup_disabled" }`.
- Do not rely only on hiding the signup page.

Also search for all signup links:

```bash
rg "signup|Sign up|Start Free Trial"
```

Update public marketing CTAs if needed so users go to `/login` or a contact flow instead of `/signup`.

## Forced password change

Add a route:

- UI: `app/(auth)/change-password/page.tsx`
- API: `app/api/auth/change-password/route.ts`

UI behavior:

- Require current session.
- Show current password, new password, confirm password.
- Submit to `/api/auth/change-password`.
- On success, route to `/dashboard`.
- No app navigation/sidebar needed on this page.

API behavior:

- Require current session and non-disabled owner.
- Validate current password against `passwordHash`.
- Require new password length at least 8.
- Reject if new password equals current password.
- Hash new password with bcrypt cost 12.
- Update `passwordHash`, set `mustChangePassword = false`.
- Return `{ success: true, redirectTo: "/dashboard" }`.

Guard behavior:

- `proxy.ts` should include `/change-password` in matcher.
- If user has valid session and `mustChangePassword` is true, redirect protected app routes to `/change-password`.
- If user has valid session and `mustChangePassword` is false, redirect `/change-password` to `/dashboard`.
- Proxy should remain an optimistic check only. Pages/APIs must still enforce where sensitive.

Since proxy should not do slow DB work per Next docs, keep the first implementation simple. Acceptable MVP options:

1. Add `role` and `mustChangePassword` to the JWT payload and refresh it when password changes.
2. Or keep proxy minimal and enforce redirects in protected server pages/layouts plus API helpers.

Option 1 has better UX. If using option 1, update `SessionPayload` to include:

```ts
role: "USER" | "SUPERADMIN";
mustChangePassword: boolean;
```

Then ensure `createToken()` receives fresh values on login and password change.

## Superadmin routes

Create a new route group:

```text
app/(superadmin)/superadmin/page.tsx
app/(superadmin)/superadmin/users/[id]/page.tsx
```

Optional shared shell:

```text
app/(superadmin)/superadmin/layout.tsx
components/superadmin/SuperAdminShell.tsx
components/superadmin/UserCreateForm.tsx
components/superadmin/UserBulkCreateForm.tsx
components/superadmin/UserFilters.tsx
components/superadmin/UserTable.tsx
components/superadmin/UserNotesForm.tsx
```

Superadmin pages should be server components where possible and call `requireSuperAdmin()` on the server.

Dashboard list page should show:

- Total users
- Trial users
- Active subscriptions
- Expired/cancelled users
- Disabled users
- Recent onboarded users
- Search/filter form
- Create user form
- Bulk onboarding form
- Users table

Users table columns:

- Name
- Email
- Role
- Subscription status
- Plan
- Trial ends at / days left
- Disabled status
- Must change password
- Shops count
- Created at
- Last login at
- Row actions: View, Disable/Enable

Filters:

- Search by email/name
- Subscription status: all, TRIAL, ACTIVE, EXPIRED, CANCELLED
- Role: all, USER, SUPERADMIN
- Disabled: all, active, disabled
- Must change password: all, yes, no

User detail page should show:

- Account info
- Subscription info read-only
- Trial dates read-only
- Razorpay IDs read-only if present
- Shops list read-only
- Internal notes edit form
- Disable/enable action
- Audit events for that user

Do not add plan management in this iteration.

## Superadmin APIs

Add APIs under:

```text
app/api/superadmin/users/route.ts
app/api/superadmin/users/[id]/route.ts
app/api/superadmin/users/[id]/notes/route.ts
app/api/superadmin/users/[id]/status/route.ts
app/api/superadmin/users/bulk/route.ts
```

All superadmin APIs must:

- Require authenticated superadmin server-side.
- Reject disabled superadmin accounts.
- Never return password hashes.
- Never return Google access/refresh tokens.
- Never return temporary passwords except immediately after create/bulk-create.

### `GET /api/superadmin/users`

Query params:

- `q`
- `subscriptionStatus`
- `role`
- `disabled`
- `mustChangePassword`
- `page`
- `pageSize`

Return paginated users with selected fields only:

```ts
{
  users: Array<{
    id: string;
    name: string;
    email: string | null;
    role: "USER" | "SUPERADMIN";
    subscriptionStatus: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
    subscriptionPlan: "STARTER" | "GROWTH" | "AGENCY" | null;
    trialStartedAt: string | null;
    trialEndsAt: string | null;
    mustChangePassword: boolean;
    disabledAt: string | null;
    internalNotes: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    shopsCount: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
}
```

### `POST /api/superadmin/users`

Body:

```ts
{
  name: string;
  email: string;
  internalNotes?: string;
}
```

Behavior:

- Normalize email lowercase/trim.
- Validate email and required fields.
- Reject duplicate email.
- Generate a temporary password using Node `crypto`, for example `crypto.randomBytes(9).toString("base64url")`.
- Hash with bcrypt cost 12.
- Create `Owner` with:
  - `role = USER`
  - `mustChangePassword = true`
  - `subscriptionStatus = TRIAL`
  - `trialStartedAt = now`
  - `trialEndsAt = now + 15 days`
  - `internalNotes`
  - `onboardedById = current superadmin id`
- Create `SuperAdminAuditLog` with `USER_CREATED`.
- Return:

```ts
{
  success: true;
  user: { id: string; name: string; email: string; trialEndsAt: string };
  temporaryPassword: string;
}
```

Do not store plaintext temporary password.

### `POST /api/superadmin/users/bulk`

Body:

```ts
{
  users: Array<{ name: string; email: string; internalNotes?: string }>;
}
```

Behavior:

- Keep MVP input simple: textarea CSV or one user per line in the UI can be parsed client-side into this JSON.
- Enforce a reasonable max batch size, e.g. 50.
- Validate all rows first.
- Skip or report duplicates clearly. Prefer returning row-level errors instead of partially failing silently.
- For successful rows, generate one temp password per user.
- Return created users with temporary passwords exactly once:

```ts
{
  created: Array<{ name: string; email: string; temporaryPassword: string; trialEndsAt: string }>;
  errors: Array<{ email?: string; index: number; error: string }>;
}
```

Create one `USERS_BULK_CREATED` audit event with metadata `{ count }`, and optionally `USER_CREATED` per created user if the detail page should show it.

### `PATCH /api/superadmin/users/[id]/notes`

Body:

```ts
{ internalNotes: string }
```

Behavior:

- Update only `internalNotes`.
- Create `USER_NOTES_UPDATED` audit event.

### `PATCH /api/superadmin/users/[id]/status`

Body:

```ts
{ disabled: boolean }
```

Behavior:

- If disabling, set `disabledAt = now`.
- If enabling, set `disabledAt = null`.
- Do not allow a superadmin to disable their own account.
- Optional: when disabling a user, set all their shops `isActive = false`.
- When enabling a user, do not automatically reactivate shops unless product wants that. For MVP, leave shop status unchanged or document the chosen behavior in UI.
- Create `USER_DISABLED` or `USER_ENABLED` audit event.

## Seed script changes

Update `prisma/seed.ts` to create initial superadmins from env.

Suggested env:

```env
SUPERADMIN_EMAILS=admin1@example.com,admin2@example.com,admin3@example.com
SUPERADMIN_PASSWORD=replace-this-shared-password
```

Behavior:

- Split and normalize `SUPERADMIN_EMAILS`.
- If either env is missing, log a warning and skip superadmin creation.
- Upsert each email as `role = SUPERADMIN`.
- Set `passwordHash` from shared env password.
- Set `mustChangePassword = false`.
- Set `subscriptionStatus = ACTIVE` or `TRIAL`; role determines access, subscription should not matter for superadmin pages.
- Preserve existing test owner/shop seed unless the project owner asks to remove it.
- Never print the raw superadmin password in logs. Log only the emails seeded.

## Normal app access rules

Update the protected pages and APIs so disabled users and superadmins do not accidentally use owner-only behavior.

Owner-only pages:

- `/dashboard`
- `/onboarding`
- `/billing`
- `/settings`
- `/google-business`

Rules:

- No session -> `/login`
- Disabled owner -> clear cookie or redirect `/login`
- Superadmin -> `/superadmin`
- Must-change-password user -> `/change-password`
- Normal user -> allow

Owner APIs should use a helper equivalent to `requireActiveUserFromRequest(req)`:

- `/api/shop`
- `/api/shop/[id]`
- `/api/owner`
- `/api/subscription/*`
- `/api/auth/google-business/*`
- `/api/dashboard/*`

Reject:

- unauthenticated
- disabled
- superadmin where the API is user/business-owner specific
- must-change-password users except `/api/auth/change-password` and logout

## UI notes

Use the existing visual language in dashboard pages: white surfaces, slate text, orange accent, compact tables. This is an operational admin tool, so keep it dense and scannable.

Recommended superadmin nav:

- ReviewQR / Superadmin
- Users
- Logout

Use `lucide-react` icons where useful. The project already depends on it.

For temporary passwords:

- Show in a success panel/table after creation.
- Make clear they are shown once.
- Include a copy button per password if straightforward.
- Do not persist them in React state beyond the current page session.
- Do not log them to console.

For bulk onboarding:

- Textarea accepts lines like:

```text
Alice Sharma, alice@example.com
Rahul Mehta, rahul@example.com, High-priority lead from WhatsApp
```

- Client parses into JSON and submits.
- Show created rows and row-level errors.

## Validation and edge cases

Handle:

- Duplicate emails.
- Missing email.
- Invalid email.
- Password hash missing on legacy owners.
- Superadmin trying to disable self.
- Superadmin creating a user with an email already used by a disabled account.
- Must-change-password user trying direct API calls.
- `/signup` direct browser hits and `/api/auth/signup` direct POSTs.
- Empty bulk onboarding textarea.
- Bulk row with comma in notes. If this becomes awkward, use tab-separated rows or JSON paste for MVP.

## Verification checklist

Run:

```bash
npm run lint
npm run db:generate
npm run db:push
npm run build
```

Manual flows:

1. Seed superadmins via `SUPERADMIN_EMAILS` and `SUPERADMIN_PASSWORD`.
2. Log in as superadmin and land on `/superadmin`.
3. Confirm superadmin cannot access `/dashboard` as a normal owner.
4. Create a user and copy the temporary password.
5. Log out, log in as that user, confirm redirect to `/change-password`.
6. Try visiting `/dashboard` before changing password, confirm redirect back to `/change-password`.
7. Change password, confirm redirect to `/dashboard`.
8. Confirm user starts in `TRIAL` with a 15-day `trialEndsAt`.
9. Confirm `/signup` and `/api/auth/signup` are disabled.
10. Disable the user from superadmin.
11. Confirm disabled user cannot log in.
12. Re-enable the user and confirm login works.
13. Update internal notes and confirm they persist.
14. Bulk onboard at least two users and one duplicate email; confirm row-level success/error output.

## Non-goals for this pass

- Superadmin-triggered password reset.
- Manual subscription/plan changes.
- User impersonation.
- MFA.
- Rate limiting.
- Email delivery for invites.
- Session revocation across devices.

These can be added later after the admin foundation is stable.
