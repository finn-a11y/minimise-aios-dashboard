# Automation Backlog

Running queue of tasks and skills to automate over time. Sorted roughly by leverage (highest first within each section). Pulled into Phase 5+ of AIOS rollout and beyond.

## How to use this file

- **Add** anything you catch yourself doing manually that could be automated. Better to capture a thin idea now than forget it.
- **Mark status** as you go: `Backlog`, `Spec'd`, `Building`, `Live`, `Killed`.
- **Score leverage** with one of: `S` (huge — ships once, saves hours/week forever), `M` (real win — saves an hour or two per week), `L` (nice to have — saves minutes).
- **Don't delete dropped items** — kill them with a one-line reason so we don't re-propose them in 6 months.

## High-priority — locks in AIOS Phase 5+

| Task | Leverage | Status | Notes |
|------|----------|--------|-------|
| Daily brief — auto-generate every morning, post to Slack | S | Backlog | AIOS Phase 5. Pulls pipeline + outreach + intel + calendar |
| Schedule `clickup-daily` to run automatically at 7:15 AM | S | Backlog | AIOS Phase 6. Currently manual invocation |
| Schedule `sales-outreach-run` daily | S | Backlog | AIOS Phase 6 |
| Wispr archive — save raw drops before processing | M | Backlog | AIOS Phase 7. Currently lost on processing |
| Drift audit — flag stale `data/README.md`, loose dept files | M | Backlog | AIOS Phase 8 |

## Sales

| Task | Leverage | Status | Notes |
|------|----------|--------|-------|
| Outreach reply triage — auto-draft replies to inbound replies on outreach threads | S | Backlog | Currently manual. Could augment with `email-draft` |
| Pipeline staleness sweep as standalone | M | Backlog | Already inside `clickup-daily`, could be its own Slack ping |
| Auto-update ClickUp Pipeline from sales call transcripts | M | Backlog | Already in `process-call` for virtual calls. Extend to phone-call recaps |
| Auto-research a prospect before a discovery call (sub-agent run) | M | Backlog | `sales-prep` agent exists, could be triggered automatically when a Calendar invite is accepted |
| Weekly outreach performance report (reply rate by vertical, by cadence step) | M | Backlog | Needs Outreach Sheet aggregation. Phase 4+ |
| Auto-transcript pipeline — Drive watcher kicks off `process-call` when a new Meet/Gemini transcript lands | S | Backlog | Removes the manual paste step. Needs n8n or scheduled trigger watching Drive |
| Wispr-drop processing skill for non-outreach phone calls (clients, partners, in-pipeline prospects) | M | Backlog | Separate from `sales-outreach-run/log_call` (cold-cadence only) and `process-call` (virtual only). Should sync ClickUp + log touchpoint to entity folder |
| Lead-to-pipeline skill — when a scraped lead replies with interest, move them into ClickUp Pipeline | M | Backlog | Partial: `sales-outreach-run` handles `meeting_booked`. Generalise for any "warm" reply |
| Follow-up reminder for stale outreach leads (no contact > N days) | M | Backlog | Different angle from `clickup-daily` staleness — sales-only focus, nudge owner |

## Marketing

| Task | Leverage | Status | Notes |
|------|----------|--------|-------|
| Schedule `dev-voice-ai-intel` weekly | M | Backlog | AIOS Phase 6 |
| Schedule `marketing-content-research` weekly | M | Backlog | AIOS Phase 6 |
| Auto-publish LinkedIn posts on a cadence | M | Backlog | `marketing-linkedin-content` generates, but scheduling is manual |
| YouTube video description / thumbnail generation from script | L | Backlog | After content engine has more volume |
| Repurpose podcast / long-form to short-form (Shorts, Reels) | L | Backlog |  |

## Relationships

| Task | Leverage | Status | Notes |
|------|----------|--------|-------|
| Weekly client performance reports auto-sent | S | Backlog | `relationships-client-reporting` skill exists but manual. Schedule + auto-email |
| Client check-in scheduling — proactive Calendar suggestions every N weeks | M | Backlog |  |
| Partner check-in cadence reminders (Leighton, Ladder Co) | M | Backlog | Monthly auto-reminder |
| Auto-flag dormant clients (no contact >60 days) | M | Backlog | Could feed daily brief |
| Client onboarding automation — after a lead converts in Pipeline, spin up ClickUp project from template, send welcome email, notify Ziv | M | Backlog | Removes manual setup work. Ties into ClickUp client-space templates |

## Finance

| Task | Leverage | Status | Notes |
|------|----------|--------|-------|
| MRR tracking dashboard / weekly snapshot | S | Backlog | Needs Stripe data layer first |
| Invoice follow-up — auto-chase overdue invoices | M | Backlog | Needs Xero or invoicing system data layer |
| Monthly P&L summary | M | Backlog |  |

## Product / Dev

| Task | Leverage | Status | Notes |
|------|----------|--------|-------|
| Per-client system health monitoring (response time, conversion) | S | Backlog | Needs Supabase / client telemetry data layer. Tied to data layer in `product/` and `relationships/` |
| Auto-detect when a deployed Speed-to-Lead system breaks | S | Backlog | Alert via Slack |
| Weekly product metrics roll-up | M | Backlog |  |

## Cross-cutting / Operations

| Task | Leverage | Status | Notes |
|------|----------|--------|-------|
| Email triage — auto-label and prioritize incoming Gmail | S | Backlog | `dev/context/gmail-triage.js` exists, partial |
| Calendar prep — daily morning summary of today's meetings with prep notes | M | Backlog | Could be part of daily brief or its own thing |
| Auto-update ClickUp Pipeline from any voice/text mention | M | Backlog | Per the "ClickUp auto-sync for sales mentions" feedback rule. Lead-management skill formalises this |
| Internal-meeting skill — process internal team meetings + sales roleplays. Routes to `~/Desktop/minimise-intel/general/internal-meetings/` + `~/Desktop/minimise-intel/sales/roleplay-calls/` | M | Backlog | Currently fully manual |
| Smart email drafting — partially live in `email-draft` (already pulls per-person writing style). Track adapt-by-context refinements (cold vs client update vs follow-up) | L | Backlog | Mostly done; this row tracks polish work |
| Post-task notification — Telegram/SMS summary after Claude completes an automated task | M | Backlog | Lets the team know what happened without checking |
| Weekly pulse check — Friday roll-up across pipeline, client progress, goals; flag anything off track | M | Backlog | Sibling to daily brief, weekly cadence |

## Killed / Won't-build

(Add reasons as items get deprioritized.)

| Task | Reason killed | Date |
|------|---------------|------|
| (none yet) | | |

## Maintenance

- Review this file weekly during Friday wrap-up.
- Move Live items into `task-audit.md` so the automation % count stays accurate.
- Promote backlog items into AIOS phases when their dependencies are met.
