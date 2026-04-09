# Golf Majors Sweepstake 2026

Fantasy golf pool for 6 friends across the 4 major tournaments. Pick 4 golfers per major, lowest combined score wins the £60 pot.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Turso (libsql) — cloud SQLite
- **ORM**: Prisma 7 with `@prisma/adapter-libsql`
- **Auth**: PIN-based, session cookies (bcryptjs)
- **Scores**: ESPN Golf API (`site.api.espn.com`)
- **Hosting**: Vercel (Hobby plan)

## Key Commands

```bash
npm run dev          # Local dev server
npm run build        # Production build
vercel --prod        # Deploy to production (must use CLI, not git push — see below)
```

## Project Structure

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — Dashboard, PickTeam, Leaderboard, AllPicks, Admin, LoginForm
- `src/lib/db.ts` — Prisma client (Turso adapter)
- `src/lib/espn.ts` — ESPN API integration (field sync + score sync)
- `src/lib/constants.ts` — Tournament config (names, deadlines, ESPN IDs)
- `src/lib/themes.ts` — Per-tournament colour schemes
- `src/lib/session.ts` — Cookie session management
- `src/lib/seed.ts` — Auto-creates tournaments on first load
- `prisma/schema.prisma` — DB schema (Competitor, Tournament, Golfer, Pick, GolferScore)

## Database

- **Turso**: `libsql://golf-majors-aj2290.aws-eu-west-1.turso.io`
- Schema: 5 tables — Competitor, Tournament, Golfer, Pick, GolferScore
- Migrations: `prisma/migrations/`
- Direct DB access: use `@libsql/client` with env vars from `.env`

## Deployment — IMPORTANT

- **Vercel Hobby plan** — git-triggered deploys may fail with "no git user" errors
- **Always deploy via CLI**: `vercel --prod` from project root
- **Git author email** must be `andrew.james@maidsafe.net` (matches GitHub account)
- **Env vars**: `.env` is gitignored. Turso credentials are set as Vercel env vars (Production scope):
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`
- **Repo is public** on GitHub (required for Hobby plan deploys from private repos)
- `.vercelignore` excludes large reference images (xlsx, screenshots) but allows `public/` assets

## Tournaments (2026)

| Major | Deadline (UTC) | ESPN ID |
|-------|---------------|---------|
| The Masters | 2026-04-09T12:00:00Z | 401811941 |
| PGA Championship | 2026-05-14T15:00:00Z | 401811947 |
| US Open | 2026-06-18T15:00:00Z | 401811952 |
| The Open | 2026-07-16T09:35:00Z | 401811957 |

Deadlines live in both `constants.ts` and the Turso DB. If you change a deadline in constants, `seed.ts` will sync it to the DB on next request. To update immediately, update the DB directly via `@libsql/client`.

## Score Syncing

- **Auto-sync**: The `/api/leaderboard` endpoint auto-syncs from ESPN when a tournament is live and last sync was >5 minutes ago. No cron needed.
- **Manual sync**: Admin panel has a "Sync Scores" button that hits `/api/admin/sync-scores`
- **Field sync**: Admin panel "Sync Field" pulls the golfer list from ESPN for a tournament
- ESPN API: `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?event={espnId}`

## Business Rules

- £10 entry, 6 players, £60 pot
- 4 picks per major: 2 European, 1 American, 1 Rest of World
- No golfer can be picked twice across all 4 majors
- Missed cut/WD penalty: R1+R2 to par + worst R3 to par + worst R4 to par in field
- Picks lock at the tournament deadline (first tee shot)

## Competitors

Ross, Euan, AJ, Ryan, Sam, Stuart — PINs are bcrypt hashed in DB. AJ is admin.

@AGENTS.md
