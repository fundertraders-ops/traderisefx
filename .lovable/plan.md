## Monthly Trading Competition Module

A free, monthly $20K demo competition with public live leaderboard, automated rollover, admin controls, and email notifications.

### 1. Database (single migration)

**Tables (all with GRANTs + RLS):**

- `competitions` — id, month (date, 1st of month, unique), name, account_size (default 20000), daily_drawdown_pct (10), max_drawdown_pct (20), prize_1 (5000), prize_2 (2000), prize_3 (1000), status (`upcoming`/`active`/`ended`/`paused`), starts_at, ends_at, winners_announced_at, created_at, updated_at
- `competition_accounts` — id, competition_id (FK), user_id (FK auth.users), account_login (text, unique per competition), account_password (text), server (text), platform (`mt4`/`mt5`), starting_balance, current_equity, current_balance, peak_equity, profit_pct, profit_usd, trades_count, win_rate, daily_loss_pct, max_drawdown_pct, status (`active`/`disqualified`/`breached`), disqualified_reason, last_updated_at, created_at — UNIQUE(competition_id, user_id)
- `competition_prizes` — id, competition_id, user_id, account_id, rank (1/2/3), amount, status (`pending`/`approved`/`paid`), paid_at, created_at

**RLS:**
- `competitions`: public read (anon+auth SELECT); admin write
- `competition_accounts`: public SELECT for leaderboard (excluding password — handle via view or column-level: easier to expose a `competition_leaderboard` view); user can SELECT their own row with password; admin full
- `competition_prizes`: user reads own; admin full

**Approach for credentials privacy:** create `public.competition_leaderboard` view selecting safe columns (no password) granted to anon+authenticated; raw table only readable by owner+admin.

### 2. Server functions (`src/lib/competitions.functions.ts`)

Public:
- `getActiveCompetition()` — current month's competition + counts
- `getLeaderboard(competitionId)` — from view, ordered by profit_pct desc, drawdown asc
- `listPreviousWinners(limit)`

Auth (requireSupabaseAuth):
- `joinCompetition()` — checks active comp, prevents duplicates, generates secure login/password, creates row, enqueues `competition-joined` email, returns credentials
- `getMyCompetitionAccount(competitionId?)`
- `getMyCompetitionHistory()`

Admin:
- `adminListCompetitions`, `adminCreateCompetition`, `adminUpdateCompetition`, `adminPauseCompetition`, `adminEndCompetition`, `adminAnnounceWinners` (computes top 3 from non-disqualified rows, inserts prizes, sends emails)
- `adminListParticipants(competitionId)`, `adminDisqualifyParticipant(id, reason)`, `adminRemoveParticipant(id)`
- `adminUpdateAccountStats(id, { equity, balance, trades_count, win_rate })` — recomputes profit + drawdown, auto-disqualifies on breach
- `adminListPrizes`, `adminApprovePrize`, `adminMarkPrizePaid`
- `adminEnsureCurrentCompetition()` — idempotent: creates this month's comp if missing (used by cron)

### 3. Automated monthly rollover

Public cron route `src/routes/api/public/hooks/competitions-rollover.ts` (POST, apikey check):
- Ends any `active` competition whose `ends_at < now()`
- Auto-announces winners for newly-ended competitions
- Creates next month's competition if not exists
- Scheduled via pg_cron daily at 00:05 UTC

### 4. Email templates (3 new)

- `competition-joined` — credentials + rules
- `competition-breached` — disqualification notice
- `competition-winner` — rank + prize

Register all three in `src/lib/email-templates/registry.ts`.

### 5. UI

**Public page `/competition` (`src/routes/competition.tsx`):**
- Hero: current month name, $20K free competition, "Join Monthly Competition" button (redirects to /auth if not signed in, else calls `joinCompetition`)
- Rules block (drawdown, no restrictions list)
- Live leaderboard table (auto-refresh via React Query refetchInterval 15s)
- Prize structure cards ($5K / $2K / $1K)
- Countdown timer to month end
- Previous winners section

**User dashboard:** add "My Competition" card in `/dashboard` showing current rank, equity, profit %, account credentials, link to `/competition`.

**Admin pages:**
- `/admin/competitions` — list, create, edit, pause/end, announce winners, participants drawer, prizes management
- Sidebar entry "Competitions" (Trophy icon)

### 6. Nav

- Add "Competition" link to public `Nav.tsx`
- Add admin sidebar item

### Technical notes

- Account stats are admin-updated (no live MT4/MT5 broker integration in scope). Real-time = polling the DB which the admin updates; leaderboard auto-refreshes every 15s.
- Drawdown breach: if `daily_loss_pct >= 10` or cumulative drawdown from peak_equity >= 20%, auto-set status=`breached` + send email.
- Tie-break: ORDER BY profit_pct DESC, max_drawdown_pct ASC.
- Credentials generated with `crypto.getRandomValues` (8-digit login, 14-char password).
- Reuses existing email infra (`enqueueTransactionalEmail`).
- One row per (competition, user) enforced by UNIQUE constraint.
