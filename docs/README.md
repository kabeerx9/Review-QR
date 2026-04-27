# ReviewQR — Build Docs

## Files

| File | What it contains |
|---|---|
| `ARCHITECTURE.md` | Full tech stack decisions, complete DB schema, folder structure, env vars, constants, Gemini prompt, WhatsApp message templates |
| `PHASE0.md` | Landing page + email/password auth + shop CRUD + QR + review skeleton. Zero external services. |
| `PHASE1.md` | Add AI review generation (Gemini) + WhatsApp interception for bad reviews |
| `PHASE2.md` | Swap email auth → phone OTP, add Google Place ID extraction, device fingerprint abuse checks |
| `PHASE3.md` | Owner dashboard — metrics, AI monthly insights, negative review list |
| `PHASE4.md` | Razorpay payments, trial expiry cron, shop deactivation |
| `PHASE5.md` | Google Business OAuth, auto-reply, customer recovery flow, competitor benchmarking |

## Build Order

Always build phases in order. Each phase depends on the previous.

**Phase 0** → zero-dependency skeleton: landing page, auth, CRUD, QR. Can demo immediately.  
**Phase 1** → add AI + WhatsApp. Now it's a real product.  
**Phase 2** → production auth + abuse prevention. Ready for real signups.  
**Phase 3** → dashboard that makes owners stick.  
**Phase 4** → revenue.  
**Phase 5** → retention + premium value.  

## Starting a Phase

Tell the coding agent:
> "Read docs/ARCHITECTURE.md and docs/PHASE{N}.md, then build Phase {N} step by step."

The agent should read ARCHITECTURE.md first on every phase — it has the schema, env vars, and design decisions.

## Auth Migration Note (Phase 0 → Phase 2)

Phase 0 uses email + password. The `Owner` model has both `email`/`passwordHash` AND `phone` fields from the start. When Phase 2 swaps to phone OTP:
- `phone` becomes the primary login identifier (already in schema)
- `email`/`passwordHash` fields stay in schema but stop being used for new signups
- Existing test accounts still work via email during dev
- No data migration needed — just update the auth API routes
