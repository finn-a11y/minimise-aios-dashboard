# Company Audit

Living source of truth for how Minimise actually runs. Three views in one place — what's automated today, what's still manual, what we're planning to build next — plus the per-area step-by-step detail. Updated continuously as things ship or shift.

Companion: `dashboard-data/*.yml` drives the public dashboard at https://aios.minimise.co.nz. Every task in this doc should also exist in `tasks.yml`.

---

## At a glance

(Refreshed via dashboard sync 2026-05-13)

- Skills live: **18**
- Tasks automated: **21 / 71** (30%)
- Hours saved per week: **38.6**
- Trigger mix: manual **20** · scheduled **1** · event **0**

| Department | Automated | Total | Hours saved/wk |
|---|---|---|---|
| Sales | 9 | 25 | 20.6 |
| Operations | 6 | 17 | 9.3 |
| Marketing | 2 | 14 | 3.7 |
| Development | 2 | 5 | 2.7 |
| Delivery | 1 | 6 | 1.5 |
| Finance | 1 | 4 | 0.8 |

---

## How the time numbers work

Every task carries two numbers, both per single execution:

- **Baseline** — minutes of *human* time it took (or would take) to run this task once, with no automation. Same number whether we do it 1×/wk or 100×/wk — it's about a single execution.
- **Now** — minutes of *human* time it takes to run this task once with the automation. Kickoff + review + tweaks only. The minutes the agent spends running don't count, because you're doing other work while it runs. For a fully unattended scheduled / event-triggered task, Now → 0.

That's it. **No frequency. No weekly hours. No theory.** Frequency and total weekly hours saved come from the Supabase execution log once it's live — every time a skill fires, we get a real row with a real duration. The markdown just states the per-execution constants.

For tasks not yet automated, `Now = Baseline` (no saving until it ships).

### Owners

- **Finn** — Sales (Finn-observed pending Jasper input), Marketing, Relationships, Operations, Cross-cutting
- **Ziv** — Dev, Product / Delivery
- **Finance** — deferred this round

---

## 1. Tasks automated

What the system handles today.

### Sales (8)
- Scrape new leads from Google Maps and Apollo — `sales-outreach-scrape` (10m → 0.2m)
- Draft daily outreach follow-up emails — `sales-outreach-run` (5m → 0.3m)
- Advance and halt outreach cadences — `sales-outreach-run` (5m → 0m · fully outsourced)
- Process a virtual sales call transcript — `process-call` (30m → 1m)
- Generate a discovery-call overview deck — `sales-overview-gen` (5m → 1m)
- Build a branded proposal with ROI numbers — `sales-proposal-gen` (5m → 1m · consolidation candidate)
- Update ClickUp Pipeline after a sales call — `process-call` _(not audited)_
- Log outreach phone calls into the sheet — `sales-outreach-run` _(not audited)_

### Operations (6)
- Build, optimise, or audit a Claude Code skill — `skill-builder` (180m → 30m)
- Plan a non-trivial multi-step build before coding — `explore` (120m → 20m)
- Draft a single Gmail in someone's voice — `email-draft` (15m → 1.5m)
- Run today's ClickUp queue across the whole workspace — `clickup-daily` **[scheduled]** _(not audited)_
- Draw an editable Excalidraw diagram from a description — `excalidraw-diagram` _(not audited)_
- Sync the public AIOS dashboard with brain content — `dashboard-sync` _(not audited)_

### Marketing (2)
- Research trending AI topics for YouTube content — `marketing-content-research` (120m → 5m)
- Repurpose long-form content into LinkedIn posts — `marketing-linkedin-content` (15m → 3m)

### Development (2)
- Build, debug, or review an n8n workflow — `dev-n8n-workflow` _(not audited — Ziv-owned)_
- Check the latest voice AI tech and platform news — `dev-voice-ai-intel` _(not audited — Ziv-owned)_

### Delivery (1)
- Generate a client performance report — `relationships-client-reporting` (15m → 3m)

### Finance (1)
- Generate a filled service agreement Google Doc — `finance-contract-gen` _(DEFERRED this audit round)_

---

## 2. Tasks not automated

The gap. 43 atomic tasks still handled by hand.

### Sales (16)
- Auto-draft replies to inbound outreach replies
- Auto-embed vertical-matched case studies in overview decks
- Auto-research a prospect before a discovery call
- Auto-send low-risk outreach follow-ups (E2 only, allowlisted)
- Auto-transcript pipeline (Drive watcher kicks off `process-call`)
- Auto-update ClickUp Pipeline from phone-call recaps
- Generate a recorded onboarding walkthrough video
- Generate weekly outreach performance report by vertical
- Move warm-reply scraped leads into ClickUp Pipeline
- Nudge owner on stale outreach leads after N days
- Process Wispr drops for non-outreach phone calls
- Render proposals and overviews in Canva instead of static HTML
- Schedule `sales-outreach-run` daily
- Standalone pipeline staleness sweep with Slack ping
- Store generated client assets in Google Drive
- Trigger onboarding workflow when a deal closes

### Operations (11)
- Archive raw Wispr drops before processing
- Auto-update ClickUp Pipeline from any voice or text mention
- Daily morning summary of today's meetings with prep notes
- Drift audit on stale `data/README.md` and loose dept files
- Friday weekly pulse roll-up across pipeline, clients, and goals
- Generate a daily brief and post to Slack
- Polish smart email drafting for context-aware tone
- Process internal team meetings and sales roleplays
- Schedule `clickup-daily` to run automatically at 7:15 AM
- Send a Telegram or SMS summary after Claude completes a task
- Triage incoming Gmail with auto-labels and priority

### Delivery (5)
- Auto-flag dormant clients with no contact for 60 days
- Auto-send weekly client performance reports
- Onboard a new client (ClickUp project, welcome email, Ziv handoff)
- Remind on partner check-in cadences (Leighton, Ladder Co)
- Suggest proactive client check-in slots in Calendar

### Marketing (12)
- Aggregate marketing platform metrics across YouTube, TikTok, Instagram, LinkedIn
- Attribute content posts to pipeline outcomes via Bitly and ClickUp
- Auto-publish LinkedIn posts on a cadence
- Capture Finn's on-camera voice profile for scripting
- Closed-loop content review cadence (performance into next-content decisions)
- Generate YouTube descriptions and thumbnails from script
- Ingest external YouTube transcripts and surface build ideas
- Repurpose long-form into Shorts and Reels
- Research Instagram content trends from curated creator list
- Research TikTok content trends from curated creator list
- Schedule content research weekly
- Schedule voice AI intel weekly

### Finance (3)
- Chase overdue invoices automatically
- Roll up monthly P&L summary
- Track MRR with a weekly snapshot

### Development (3)
- Detect when a deployed Speed-to-Lead system breaks
- Per-client system health monitoring (response time, conversion)
- Weekly product metrics roll-up

---

## 3. Recommended automations (next builds)

Prioritised by leverage — what we should build next. The full table-form backlog with leverage tags lives in [`automation-backlog.md`](automation-backlog.md). This section pulls out the highest-priority items plus everything surfaced through the per-area audit.

### Highest leverage from the Sales audit

1. **Schedule the daily sales prompts** (`sales-outreach-run` + `clickup-daily`) — eliminates 3+ daily manual triggers; tiny build (launchd plist); validates the pattern for other areas.
2. **Reliability audit on Pipeline mgmt + Proposal skills** — cheap; surfaces whether existing skills actually do their job (process-call subtask creation, proposal stage update, post-call1-not-keen flow).
3. **Pipeline hygiene / stale-lead surfacing** — greenfield, high impact, no overlap with existing skills.
4. **Onboarding handoff trigger** (Won → in-person AIOS rollout meeting prep) — high strategic value as client count grows.
5. **Asset creation redesign** (Drive storage + Canva rendering + vertical case-study embedding) — highest-impact but biggest project; needs a design pass before any build.

### Priority backlog (S-leverage from `automation-backlog.md`)

- Daily brief — auto-generate every morning, post to Slack (Operations)
- Schedule `clickup-daily` to run automatically at 7:15 AM (Operations)
- Schedule `sales-outreach-run` daily (Operations)
- Outreach reply triage — auto-draft replies to inbound replies (Sales)
- Auto-transcript pipeline — Drive watcher kicks off `process-call` (Sales)
- Weekly client performance reports auto-sent (Delivery)
- MRR tracking dashboard / weekly snapshot (Finance)

### Surfaced from this audit (Sales area)

- Trigger onboarding workflow when a deal closes
- Render proposals and overviews in Canva instead of static HTML
- Store generated client assets in Google Drive
- Auto-embed vertical-matched case studies in overview decks
- Generate a recorded onboarding walkthrough video
- Auto-send low-risk outreach follow-ups (E2 only, allowlisted)

### Highest leverage from the Marketing audit

1. **Verify `marketing-content-research` cron actually fires** — cheapest possible win; the Monday 10am NZT trigger may already be working and we don't know it.
2. **Activate dormant Marketing skills** (`marketing-transcript-ingest` CapCut watcher, use the research digest in ideation, slot `marketing-linkedin-content` into the posting loop) — all built, just need plumbing.
3. **Tracking foundation** (YouTube analytics + LinkedIn metrics + Bitly attribution) — closes the data loop; priority order already named in `marketing/data/README.md`.
4. **Voice profile capture for Finn** — cross-cutting unlock that improves scripting, email-draft tone, and the LinkedIn skill's output.
5. **Build the YouTube transcript-scribe skill** — Finn explicitly named it; turns external research into plan candidates.

### Surfaced from this audit (Marketing area)

- Ingest external YouTube transcripts and surface build ideas
- Research TikTok content trends from curated creator list
- Research Instagram content trends from curated creator list
- Capture Finn's on-camera voice profile for scripting
- Aggregate marketing platform metrics across YouTube, TikTok, Instagram, LinkedIn
- Attribute content posts to pipeline outcomes via Bitly and ClickUp
- Closed-loop content review cadence (performance into next-content decisions)

### Highest leverage from the Relationships audit

1. **Active-client touchpoint log + stale detector** — keystone build. Port the Outreach-tab pattern across to active clients. Unblocks proactive check-ins, cadence enforcement, overdue-reply detection, and feeds the rewritten reporting skill.
2. **`relationships-client-reporting` rewrite** — current skill is a stub no one uses. Once rebuilt as the Supabase-backed source-of-truth, it powers both the client-facing dashboard and the monthly report. Single rewrite, two tasks unblocked.
3. **CRM hygiene / audit skill** — pure greenfield. Surfaces stale tasks, missing fields, duplicates, orphan rows. Scheduled weekly. No overlap with anything existing.
4. **Wispr-drop / casual-mention → Pipeline sync** — fixes the `CLAUDE.md` "do it manually" failure mode for phone notes / email threads / casual chat. Pairs with the planned lead-management skill.
5. **Pipeline lifecycle move automation** (Prospect → Active → Archived) — when `process-call` detects the signal, also do the folder `git mv` + index update so brain and ClickUp don't drift. Small extension to an existing skill.

### Surfaced from this audit (Relationships area)

- Active-client touchpoint log (parallel to the Outreach-tab structure)
- Stale-client detector (haven't-contacted-in-N-days surfacing)
- Overdue-reply detector on client threads
- `relationships-client-reporting` rewrite (Supabase-backed)
- Client-facing live dashboard
- End-of-month client report
- CRM hygiene / audit skill (stale, duplicates, orphans, missing fields)
- Wispr-drop / casual-mention → Pipeline sync
- Pipeline lifecycle move automation (folder `git mv` + index update)
- Reliability audit on existing CRM-writing skills (`email-draft`, `sales-proposal-gen`, etc.)

### Highest leverage from the Operations audit

1. **Finish + schedule `clickup-daily`** (7:15 AM launchd) — unblocks CRM management, Client communications, Task management, and daily prioritisation simultaneously. Skill already partially built — finish it, then schedule. Lowest effort / highest leverage in the audit.
2. **Pre-commit secret-scan hook** (`gitleaks` or `trufflehog`) — single bash hook, well-understood pattern, prevents an incident class with no ongoing maintenance. Pair with enabling GitHub push protection on the remote.
3. **Drift audit substrate** (AIOS Phase 8) — one scheduled skill, four targets: stale `data/README.md`, `.claude/skills/*` vs `skills.yml`, SKILL.md vs `CLAUDE.md` table, MCP tools vs `reference.md`. Surface in a Friday "structure health" Slack DM.
4. **Post-skill-ship hook → auto-draft `skills.yml` row** — hook on new `.claude/skills/*/SKILL.md` create event. Reads frontmatter, drafts the YAML row, prompts Finn to confirm + sync. Closes most of the dashboard drift gap.
5. **Daily brief + Friday weekly pulse** (Slack-posted) — the proactive watcher layer this whole audit keeps surfacing as missing. Aggregates pipeline, clients, dashboard delta, drift findings, stale work into one digest.
6. **`dev-secrets-vault-migrate` + `dev-client-creds-inventory`** — first two security skills. Get loose secrets off `~/Downloads/`, get a credential map written. Everything else in the security stack depends on these.

### Surfaced from this audit (Operations area)

- Finish + schedule `clickup-daily` at 7:15 AM (already in backlog, surfaced repeatedly)
- Pre-commit secret-scan hook (`gitleaks` / `trufflehog`)
- Drift audit substrate (AIOS Phase 8 — stale `data/README.md`, dead skills, MCP drift, SKILL.md drift, CLAUDE.md table drift)
- Skill misfire detection (post-skill-run hook + `skill-runs.jsonl` + weekly failure digest)
- Skill usage tracker (counts invocations, flags 30/60-day dead skills)
- SKILL.md ↔ behaviour reconciliation (monthly compare declared triggers to actual runs)
- Auto-register new skills (post-skill-build hook → `skills.yml` row + `CLAUDE.md` table)
- Hook health check (lists active hooks, last-fired dates, referenced-script existence)
- `dev-secrets-vault-migrate` (sweep loose local secrets into controlled path / 1Password)
- `dev-client-creds-inventory` (credential map from Supabase Vault + vendors)
- `dev-shared-creds-grant` (grant / revoke team-vault access with Slack diff)
- `dev-tool-onboard` (new MCP / SaaS / client integration checklist)
- `dev-creds-rotation-check` (weekly launchd; stale-key flagging + ClickUp + Slack)
- `dev-offboard` (revoke checklist when a teammate leaves)
- `dev-secret-incident` (leak / breach response playbook)
- `dev-outbound-scrub` (internal-identifier scan inside `sales-proposal-gen`, `sales-overview-gen`, `email-draft`, `process-call`)
- `dev-access-log` (aggregated weekly audit digest + anomaly ping)
- Task creation convention / instruction file (so Claude stops guessing list/status/assignee/due date)
- Task close-out automation (skills confirm subtask completion after the work)
- Active CRM watcher (proactive priorities, surfaces stale work)
- Dashboard drift audit (`.claude/skills/` vs `skills.yml` vs `tasks.yml`)
- Post-`dashboard-data/*.yml` edit auto-run `dashboard-sync`

See the per-area detail below for the full step-by-step context behind each.

---

## 4. Future automations (ideas to integrate)

Capture-bucket for things we'd like to build but haven't started yet. Lower priority and less specced than the Recommended list above — held here so they don't get forgotten. Promote to Recommended (and into `automation-backlog.md`) when one is ready to act on.

### Analytics & internal reporting
- Analytic agent or skill that runs internal performance reports across pipeline, content, clients, and finance — surfacing trends weekly without us having to dig.

_(Add new ideas as they surface.)_

---

## 5. Per-area detail

How each task actually runs today, step by step. Built area by area through walkthrough sessions. Use this section when planning a specific automation build — it shows where automation already exists within each task, where the gaps sit, and what the handoffs look like.

### Progress

| Area | Tasks | Captured |
|---|---|---|
| Sales | 5 | 5/5 ✅ |
| Marketing | 7 | 7/7 ✅ |
| Delivery | 8 | 0/8 |
| Relationships | 3 | 3/3 ✅ |
| Operations | 5 | 5/5 ✅ |
| Finance | 3 | 3/3 ✅ |
| Development | 3 | 3/3 ✅ |

### Schema per task

Each captured task shows:
- **How we achieve this task today** — 1–2 sentence summary of the lived process
- **Steps** — concrete numbered list, each with actor / system / existing automation / trigger type / notes
- **Automation summary** — automated step count, manual gaps, skills involved, trigger mix

### Sales

#### Lead acquisition

**How we achieve this task today**

Lead acquisition is fully manual and ad-hoc. Jasper (primary owner of outreach) decides on a whim when the pipeline feels thin, picks a vertical and region, and runs the `sales-outreach-scrape` skill — which does Google Maps discovery then Apollo enrichment to land 20-at-a-time decision-makers into the `Scraped - Jasper` tab of the Outreach sheet. Referrals, marketing-agency affiliates and inbound also trickle in, but none of those channels have a formal capture process yet.

**Steps**

1. Operator decides it's time to scrape leads
    - Actor: Jasper (primary) or Finn
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: No schedule, no signal, no prompt — pure operator gut call.
2. Operator picks the vertical + region for today's scrape
    - Actor: Jasper
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: Ad-hoc choice from the ICP list in `sales/context.md`; no logic deciding which vertical needs topping up.
3. Discovery — Google Maps sweep of every good-fit company in vertical + region, written to `Pre-Scraped - {Owner}` tab
    - Actor: `sales-outreach-scrape`
    - System: Google Maps API + Outreach Sheet
    - Existing automation: `sales-outreach-scrape`
    - Trigger type: Manual
    - Notes: Free-tier, no count limit. Same skill invocation chains into step 4.
4. Enrichment — Apollo looks up decision-maker name + email + phone for 20 companies at a time, dedups against Outreach, appends to `Scraped - {Owner}` tab
    - Actor: `sales-outreach-scrape`
    - System: Apollo + Outreach Sheet
    - Existing automation: `sales-outreach-scrape`
    - Trigger type: Manual
    - Notes: 20-at-a-time cap is the Apollo credit-spend governor. Business Phone (from Google) and Contact Phone (from Apollo) both retained.
5. Referral / marketing-agency affiliate / inbound lead capture
    - Actor: Finn or Jasper
    - System: Email / conversation
    - Existing automation: none
    - Trigger type: None
    - Notes: Low volume right now so not prioritised — no defined capture path, lead lands wherever it's first noticed.

**Automation summary**

- Steps automated: 2 of 5
- Manual gaps:
    - Step 1 — no prompt or signal triggers a scrape; relies on operator remembering.
    - Step 2 — no logic decides which vertical/region to top up.
    - Step 5 — referral / affiliate / inbound has no capture pipeline.
- Existing skills involved: `sales-outreach-scrape`
- Trigger mix: Manual 2, Event 0, Scheduled 0, None 3

---

#### Pipeline management

**How we achieve this task today**

Leads enter the ClickUp Pipeline list (`901614398702`) via outreach replies or virtual-call drops, with `sales-outreach-run`, `email-draft`, and `process-call` doing most of the ClickUp writes. Once a lead is in pipeline, mid-stage transitions (Proposal Sent → Negotiation → Won/Lost) are mostly manual or only loosely covered by skills Finn isn't confident are firing correctly. There is no automated pipeline hygiene, no stale-lead surfacing, no subtask watcher, and no onboarding handoff trigger — the back half of the pipeline relies on humans remembering or verbally asking Claude.

**Steps**

1. Lead added to ClickUp Pipeline from an outreach reply or first warm signal
    - Actor: `sales-outreach-run` / `email-draft`
    - System: ClickUp Sales > Pipeline (`901614398702`)
    - Existing automation: `sales-outreach-run`, `email-draft`
    - Trigger type: Manual
    - Notes: Finn unsure exactly which skill creates vs updates the task; behaviour overlaps between the two.
2. Discovery / virtual call held — ClickUp synced, stage advanced, subtasks created
    - Actor: `process-call`
    - System: ClickUp Pipeline
    - Existing automation: `process-call`
    - Trigger type: Manual
    - Notes: Auto-applies status diff + creates new task if missing (ICP only). Subtask creation is in the spec but Finn isn't sure how well it actually executes.
3. Post-Call-1 follow-up routing (keen path) — ClickUp updated, follow-up drafted
    - Actor: `sales-post-call1-keen`
    - System: ClickUp + Gmail
    - Existing automation: `sales-post-call1-keen`
    - Trigger type: Manual
    - Notes: none
4. Post-Call-1 follow-up routing (not-keen path) — lead moved to Lost, door's-open email drafted
    - Actor: `sales-post-call1-not-keen`
    - System: ClickUp + Gmail
    - Existing automation: `sales-post-call1-not-keen`
    - Trigger type: Manual
    - Notes: Finn flagged "only does a little specific thing" — not confident it's fully covering the not-keen flow.
5. Proposal generated and sent — stage moved to Proposal Sent
    - Actor: `sales-proposal-gen`
    - System: ClickUp + Google Drive
    - Existing automation: `sales-proposal-gen` (ClickUp update assumed but unverified)
    - Trigger type: Manual
    - Notes: Finn assumes ClickUp gets updated but is not confident it's working reliably.
6. Stage transitions Proposal Sent → Negotiation → Won
    - Actor: Finn / Jasper (sometimes ask Claude verbally)
    - System: ClickUp UI
    - Existing automation: none
    - Trigger type: None
    - Notes: No skill owns mid-to-late stage moves — done by hand or ad-hoc Claude prompt.
7. Subtask creation + execution per stage goal
    - Actor: `process-call` (creation, partial) / humans (execution)
    - System: ClickUp
    - Existing automation: `process-call` partial
    - Trigger type: Manual
    - Notes: Subtask creation is unverified; no watcher executes or chases them; team isn't notified when subtasks come due.
8. Won → onboarding handoff to Ziv / build team
    - Actor: Finn / Jasper
    - System: verbal / face-to-face
    - Existing automation: none
    - Trigger type: None
    - Notes: Going forward, onboarding will be an in-person setup meeting — handoff trigger still entirely manual.
9. Lost transition for stages past Call 1 (Proposal / Negotiation gone cold)
    - Actor: Finn / Jasper
    - System: ClickUp UI
    - Existing automation: none
    - Trigger type: None
    - Notes: No skill picks up cold late-stage leads; manual drag to Lost.
10. Daily pipeline review — overdue tasks + stale-parent surfacing
    - Actor: `clickup-daily` (when typed) / Finn (ad-hoc "who do I need to follow up with today?")
    - System: ClickUp
    - Existing automation: `clickup-daily`
    - Trigger type: Manual
    - Notes: Intended as the daily overview + stale-parent flagger; Finn unsure it's properly set up or being used consistently.
11. Stale-lead surfacing / pipeline hygiene (lead hasn't moved in N days)
    - Actor: Finn / Jasper
    - System: ClickUp board eyeballing
    - Existing automation: none
    - Trigger type: None
    - Notes: No structured follow-up cadence once a lead is in pipeline; no automated nudges; same gap for active clients.

**Automation summary**

- Steps automated: 6 of 11 (with reliability concerns on 3, 5, and 7)
- Manual gaps:
    - Step 6 — mid-to-late stage moves have no owning skill
    - Step 8 — Won → onboarding handoff is verbal only
    - Step 9 — late-stage Lost transitions are manual
    - Step 11 — no stale-lead / hygiene surfacing at all
- Existing skills involved: `sales-outreach-run`, `email-draft`, `process-call`, `sales-post-call1-keen`, `sales-post-call1-not-keen`, `sales-proposal-gen`, `clickup-daily`
- Trigger mix: Manual 6, Event 0, Scheduled 0, None 5

---

#### Asset creation

**How we achieve this task today**

Asset creation runs entirely off the back of `process-call`. After a discovery or sales call, Finn or Jasper manually pastes the transcript into Claude, which fires `process-call` → which invokes `sales-overview-gen` (and `sales-proposal-gen` when a proposal is needed) to produce HTML/PDF assets personalised to what was discussed. Jasper also runs `sales-overview-gen` directly to draft template PDFs. Assets currently land in `sales/context/Assets/` in this repo (wrong place — should move to Google Drive + an external repo). The whole process needs to be redesigned: Canva MCP is unused, no real personalisation pipeline, storage location is wrong, onboarding has shifted to a 3-hour face-to-face meeting so the old onboarding decks are no longer asset-driven.

**Steps**

1. Discovery / sales call happens (Google Meet, Zoom, or Teams)
    - Actor: Jasper (occasionally Finn)
    - System: Google Meet / Gemini transcript
    - Existing automation: none
    - Trigger type: None
    - Notes: Asset creation is downstream of this — no call, no asset.
2. Transcript exported and pasted into Claude
    - Actor: Jasper
    - System: Claude Code
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Fully manual paste — no transcript watcher / drop folder / webhook firing this.
3. `process-call` skill fires, orchestrates the asset creation flow
    - Actor: `process-call`
    - System: Claude Code
    - Existing automation: `process-call`
    - Trigger type: Manual
    - Notes: Triggered by typed phrase or pasted transcript. Handles ClickUp sync + transcript routing + asset generation + follow-up email in one pass.
4. Personalised overview HTML + PDF generated for the prospect
    - Actor: `sales-overview-gen`
    - System: Claude Code (HTML build off Harrisons template)
    - Existing automation: `sales-overview-gen`
    - Trigger type: Event (invoked by `process-call`) / also Manual when Jasper runs it directly to draft templates
    - Notes: Whole approach needs to be replaced — visual template is hardcoded, no Canva integration, no shared asset library. Should connect to Canva so assets are editable/shareable.
5. Proposal asset generated (only when a proposal is needed) — extracts inputs from the transcript (company, contact, industry, lead volume, job value, recommended systems), runs ROI calcs against the locked pricing model, renders to HTML then converts to PDF
    - Actor: `sales-proposal-gen`
    - System: Claude Code (HTML + ROI calcs → PDF)
    - Existing automation: `sales-proposal-gen`
    - Trigger type: Manual (or invoked by `process-call`)
    - Notes: Pulls pricing logic from `finance/context/pricing-strategy.md`; current ROI benchmarks are baked into the skill template. Template needs updating; output should move to Canva for better visual structure; HTML→PDF flow flagged for replacement. Finn unsure proposal asset is even necessary in every case — needs reassessing as part of the redesign. Delivery + ClickUp stage update to "Proposal Sent" is currently manual (confirms the reliability concern from Pipeline management step 5).
6. Contract / service agreement generated when signing
    - Actor: `finance-contract-gen`
    - System: Google Docs
    - Existing automation: `finance-contract-gen`
    - Trigger type: Manual
    - Notes: Already Google-Doc-based, which is closer to where the rest of the assets should sit.
7. Case studies bundled with overview where relevant
    - Actor: Jasper (manual selection from `sales/context/Assets/`)
    - System: Claude Code / static HTML files
    - Existing automation: none
    - Trigger type: None
    - Notes: Only one case study currently exists (`case-study-nz-lifebrokers.html`). Ziv is building a skill to generate more. Should be auto-attached/embedded into the overview based on vertical.
8. Asset stored after generation
    - Actor: Claude Code (writes to repo)
    - System: `sales/context/Assets/` in this repo
    - Existing automation: none
    - Trigger type: None
    - Notes: Wrong location. Should move to Google Drive (shareable, personalised) + external repo (for quick query/recall). Storing in minimise-brain overcomplicates the repo and leaks personalised prospect info into shared knowledge.
9. Follow-up email drafted with asset attached and sent to prospect
    - Actor: `process-call` → `email-draft`
    - System: Gmail draft
    - Existing automation: `process-call`, `email-draft`
    - Trigger type: Event (chained inside `process-call`)
    - Notes: This part works — attachment + draft are produced automatically.
10. Onboarding asset delivery (post-signing)
    - Actor: Finn / Jasper (in-person)
    - System: Face-to-face meeting (~3 hrs)
    - Existing automation: none
    - Trigger type: None
    - Notes: Onboarding shifted from form → call → 3-hour in-person AIOS rollout meeting. The existing `onboarding-speed-to-lead.html` / `onboarding-lead-reactivation.html` / `onboarding-welcome-deck.html` decks are no longer how onboarding actually happens. Needs to be rethought as part of the redesign — possibly a recorded video asset for next-steps context.
11. Canva-based shareable / editable asset version
    - Actor: none
    - System: Canva MCP (available, unused)
    - Existing automation: none
    - Trigger type: None
    - Notes: Canva MCP is connected but has never been used for asset creation. Target state — assets generated as HTML, pushed into Canva for visual polish + sharing.

**Automation summary**

- Steps automated: 5 of 11
- Manual gaps:
    - Step 1 — human call, can't automate
    - Step 2 — transcript paste is manual, no watcher
    - Step 7 — case study selection is manual, generator skill in progress (Ziv)
    - Step 8 — storage location is wrong + manual file save
    - Step 10 — onboarding is fully in-person, no asset pipeline
    - Step 11 — Canva integration entirely missing
- Existing skills involved: `process-call`, `sales-overview-gen`, `sales-proposal-gen`, `finance-contract-gen`, `email-draft`
- Trigger mix: Manual 4, Event 2, Scheduled 0, None 5

---

#### Comms

**How we achieve this task today**

Comms today only cover the cold outreach cadence — there's no automation for ClickUp Pipeline follow-ups or client communications. Each weekday morning Jasper (and Finn) manually ask Claude "who do I need to follow up with today", which fires `sales-outreach-run`. That skill reads the Outreach sheet, figures out which leads are due based on their cadence day (E-E-C-E-C-E-C, +2 days between touches), drafts emails as Gmail drafts, and surfaces the call list — the operator then reviews and clicks Send.

**Steps**

1. Operator opens Claude in the morning (Mon–Fri) and types "who do I need to follow up with today" / "do my outreach today"
    - Actor: Finn / Jasper
    - System: Claude Code
    - Existing automation: none
    - Trigger type: None
    - Notes: Entirely human-initiated. `clickup-daily` exists but isn't used yet; nothing prompts the operator to run this on a schedule.
2. Skill reads the Outreach sheet, identifies leads whose cadence is due today (+2 day spacing), and classifies each as email or phone-call touch
    - Actor: `sales-outreach-run`
    - System: Google Sheets (Outreach sheet)
    - Existing automation: `sales-outreach-run`
    - Trigger type: Manual
    - Notes: Owner-isolated (Finn never touches Jasper's leads). Cadence is fixed E-E-C-E-C-E-C, 6–7 touches.
3. Skill drafts each follow-up email using the right template for the cadence day, in the operator's voice, with the Minimise footer
    - Actor: `sales-outreach-run`
    - System: Gmail
    - Existing automation: `sales-outreach-run`
    - Trigger type: Manual
    - Notes: HTML-only multipart drafts, no em dashes in body, casual Kiwi voice rules apply.
4. Skill surfaces the call list for phone-call touches (no auto-dial — just the names/numbers)
    - Actor: `sales-outreach-run`
    - System: Claude Code output
    - Existing automation: `sales-outreach-run`
    - Trigger type: Manual
    - Notes: Operator makes the calls manually; logs the outcome later via the same skill ("I just called X").
5. Operator reviews each Gmail draft and clicks Send
    - Actor: Finn / Jasper
    - System: Gmail
    - Existing automation: none
    - Trigger type: None
    - Notes: Drafts only — nothing auto-sends.
6. Operator makes the phone-call touches manually, then dictates a recap back into Claude
    - Actor: Finn / Jasper
    - System: Phone + Claude Code
    - Existing automation: `sales-outreach-run` (logs the call after the fact)
    - Trigger type: Manual
    - Notes: Wispr recap of a phone call where the contact is in the Outreach tab re-triggers the skill to log it.
7. Skill scans replies on outreach threads and advances / halts cadences based on what came back
    - Actor: `sales-outreach-run`
    - System: Gmail + Google Sheets
    - Existing automation: `sales-outreach-run`
    - Trigger type: Manual
    - Notes: Only runs when operator asks ("check my outreach replies"); no event hook watching the inbox.
8. ClickUp Pipeline follow-ups (post-discovery-call leads)
    - Actor: manual
    - System: ClickUp
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. `clickup-daily` is built for this but isn't used. Pipeline subtask follow-ups are not tracked or drafted today.
9. Client / ongoing-relationship follow-ups
    - Actor: manual
    - System: Gmail / phone
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. No skill, no tracker, no reminder system for client comms or check-ins.

**Automation summary**

- Steps automated: 4 of 9
- Manual gaps:
    - Step 1 — no scheduled trigger; operator has to remember to ask each morning.
    - Step 5 — every email send is a manual click (by design, drafts-only).
    - Step 6 — phone calls themselves are human; only the logging is assisted.
    - Step 8 — ClickUp Pipeline follow-ups have no automation in use (`clickup-daily` exists but isn't run).
    - Step 9 — client follow-ups have no tracking or drafting at all.
- Existing skills involved: `sales-outreach-run`, (`clickup-daily` available but unused)
- Trigger mix: Manual 4, Event 0, Scheduled 0, None 5

---

#### Sales intel

**How we achieve this task today**

Sales intel covers everything that informs sales decisions without directly touching the pipeline — competitor research, prospect research before a discovery call, and reporting on outreach performance. Today only competitor research is automated (via `sales-competitor-analysis`); prospect research is fully manual and there is no outreach performance reporting at all.

**Steps**

1. Competitor research — produce a strategy report on a competitor in the AI follow-up / voice AI space
    - Actor: `sales-competitor-analysis`
    - System: Claude Code (skill) + WebSearch / WebFetch
    - Existing automation: `sales-competitor-analysis`
    - Trigger type: Manual
    - Notes: Run on demand when Finn wants a positioning read. Output is a structured strategy report; no schedule or trigger watching the competitor landscape.
2. Prospect research before a discovery call (business overview, product fit, talking points)
    - Actor: Finn / Jasper (today, manually); planned `sales-prep` sub-agent
    - System: Claude Code (ad-hoc) / web
    - Existing automation: none (a `sales-prep` sub-agent is declared in `CLAUDE.md` but not wired into a pre-call trigger)
    - Trigger type: None
    - Notes: Today this is "scan the website + LinkedIn for 10 minutes before the call". No automated pre-call brief, no Calendar hook, no consistent output format.
3. Weekly outreach performance reporting by vertical (response rate, booked-meeting rate, cadence drop-off)
    - Actor: none
    - System: Outreach sheet + Gmail thread data
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. No regular roll-up of outreach metrics; the team can't tell which verticals/templates are working without manually scrolling the sheet.

**Automation summary**

- Steps automated: 1 of 3
- Manual gaps:
    - Step 2 — no automated pre-call prospect research; `sales-prep` exists as a sub-agent declaration but doesn't fire from a Calendar/ClickUp event
    - Step 3 — no weekly outreach performance roll-up; no per-vertical visibility
- Existing skills involved: `sales-competitor-analysis`
- Trigger mix: Manual 1, Event 0, Scheduled 0, None 2

### Marketing

#### Ideation

**How we achieve this task today**

Ideation runs on three tracks: two locked series formats (Day X of automating Minimise + Day X of automating client AIOS builds) where the "what to film" is just whatever was shipped that day, a weekly automated research scan that pulls trending AI-space topics into Slack, and Finn's head for everything else. The research tool exists but Finn flagged it needs tuning.

**Steps**

1. Series content ideation — "Day X of automating Minimise"
    - Actor: Finn
    - System: internal brain/build work
    - Existing automation: none
    - Trigger type: None
    - Notes: Format is locked, so no per-video ideation needed; topic = whatever skill/automation was just shipped. No system flags "ship → film" — relies on Finn noticing.
2. Series content ideation — "Day X of automating [client]"
    - Actor: Finn
    - System: client AIOS engagements
    - Existing automation: none
    - Trigger type: None
    - Notes: Same locked format applied to live client builds; goal is documenting 1000+ hours of automation across clients. No automated trigger when a client-build milestone hits.
3. Weekly AI-space research scan
    - Actor: cron + `marketing-content-research`
    - System: launchd (`co.minimise.content-research.plist`) → orchestrator → articles + youtube sub-skills → minimise-intel + Slack
    - Existing automation: `marketing-content-research` (with `marketing-research-articles` + `marketing-research-youtube`)
    - Trigger type: Scheduled
    - Notes: Fires Monday 10am NZT; Slack DM with top-3 picks + digest in `minimise-intel/marketing/content-research/`. Finn says it needs more tuning. Social stream (`marketing-research-social`) is built but DEFERRED — needs Apify paid plan.
4. Pick ideas from the Monday digest
    - Actor: Finn
    - System: Slack DM + minimise-intel digest file
    - Existing automation: none
    - Trigger type: None
    - Notes: Human selection layer between research output and content production — Finn reads top 3 and decides what (if any) to film.
5. Ad-hoc ideation — whatever pops into Finn's head
    - Actor: Finn
    - System: n/a
    - Existing automation: none
    - Trigger type: None
    - Notes: No capture system; relies on memory. Risk of losing ideas between brainwave and filming.

**Automation summary**

- Steps automated: 1 of 5
- Manual gaps:
    - Step 1 — no "skill shipped → film a Day X video" trigger
    - Step 2 — no "client milestone → film" trigger
    - Step 4 — human picks from digest
    - Step 5 — no capture system for ad-hoc ideas
- Existing skills involved: `marketing-content-research`, `marketing-research-articles`, `marketing-research-youtube` (`marketing-research-social` built but not dispatched)
- Trigger mix: Manual 0, Event 0, Scheduled 1, None 4

---

#### Tracking

**How we achieve this task today**

There is effectively no marketing tracking in place. Finn glances at view counts on individual posts when he happens to open the platforms, but nothing is captured, aggregated, or reviewed on a cadence. No analytics pulls, no attribution, no engagement reports — `marketing/data/README.md` confirms YouTube analytics, LinkedIn metrics, and Bitly attribution are all "not yet wired."

**Steps**

1. Finn opens YouTube / Instagram / TikTok / LinkedIn ad hoc and eyeballs view counts on recent posts
    - Actor: Finn
    - System: YouTube Studio, Instagram, TikTok, LinkedIn (native apps)
    - Existing automation: none
    - Trigger type: None
    - Notes: No cadence, no capture, no comparison across posts or platforms. View count is the only metric looked at.
2. No aggregation of metrics across platforms
    - Actor: manual
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. No dashboard, sheet, or repo file collects performance data.
3. No engagement / audience signal capture (comments, replies, DMs, saves, shares)
    - Actor: manual
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. `marketing/intelligence/README.md` notes YouTube comment threads are "not yet captured."
4. No attribution from content → pipeline (which post drove which discovery call / inbound lead)
    - Actor: manual
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. Bitly + ClickUp join listed as wiring priority #3 in `marketing/data/README.md` but not built.
5. No periodic review / decision loop (what's working → make more of it)
    - Actor: manual
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. Content strategy in `marketing/context.md` is not closed-loop with performance data.

**Automation summary**

- Steps automated: 0 of 5
- Manual gaps:
    - Step 1 — ad hoc eyeballing only, no cadence or capture
    - Step 2 — no aggregation across platforms
    - Step 3 — no engagement capture
    - Step 4 — no attribution to pipeline
    - Step 5 — no review cadence / decision loop
- Existing skills involved: none
- Trigger mix: Manual 0, Event 0, Scheduled 0, None 5

---

#### Content creation

**How we achieve this task today**

Content creation is almost entirely manual end-to-end. Finn does ideation himself (research substrate exists but is barely used), writes scripts solo or via ad-hoc Claude chats with copy-paste back and forth, films, edits, and posts on his own with no automation in the loop.

**Steps**

1. Content ideation
    - Actor: Finn
    - System: head
    - Existing automation: `marketing-content-research` (built, weekly digest runs Mondays 10am NZT via launchd — but Finn isn't actually using the output yet)
    - Trigger type: Scheduled
    - Notes: Research substrate exists (articles + YouTube sub-skills, Slack top-3 DM) but disconnected from actual ideation — runs in the background, Finn doesn't pull from it.
2. Scripting / outlining
    - Actor: Finn
    - System: Claude (ad-hoc chat)
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Sometimes Finn pastes context into Claude for help, but it's manual copy-paste back and forth — no skill, no repo context, no brand voice loaded automatically.
3. Filming
    - Actor: Finn
    - System: camera / phone
    - Existing automation: none
    - Trigger type: None
    - Notes: Solo filming; no automation possible at this step.
4. Editing
    - Actor: Finn
    - System: CapCut
    - Existing automation: none (but `marketing-transcript-ingest` is built and ready to fire on CapCut exports via launchd watcher)
    - Trigger type: None
    - Notes: Editing is fully manual; the transcript-ingest watcher would auto-capture exports the moment they finish but it isn't wired up yet (no CapCut export folder set, no API keys dropped).
5. Posting
    - Actor: Finn
    - System: Instagram / TikTok / YouTube / LinkedIn
    - Existing automation: `marketing-linkedin-content` exists for repurposing but isn't in the live loop
    - Trigger type: Manual
    - Notes: Posting is fully manual across all platforms; no scheduling tool, no cross-post automation, no repurposing fired automatically from exports.

**Automation summary**

- Steps automated: 0 of 5 (one scheduled job exists upstream but isn't feeding the workflow)
- Manual gaps:
    - Step 1 — research digest exists but Finn isn't pulling from it during ideation
    - Step 2 — scripting is ad-hoc Claude chats, no skill
    - Step 3 — filming is inherently human
    - Step 4 — editing is human; transcript ingest watcher built but not activated
    - Step 5 — every platform posted to by hand
- Existing skills involved: `marketing-content-research` (scheduled but unused downstream), `marketing-transcript-ingest` (built, not activated), `marketing-linkedin-content` (built, not in loop)
- Trigger mix: Manual 2, Event 0, Scheduled 1, None 2

---

#### Scripting

**How we achieve this task today**

Scripting is almost entirely manual — Finn writes every script himself in his own tone and structure. The only assist is occasionally pasting a draft into Claude for ideas, but there's no captured voice profile, so Claude's output doesn't sound like him. No dedicated skill, hook, or routine exists for this work.

**Steps**

1. Finn writes the script from scratch in his own tone and structure
    - Actor: Finn
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: No documented voice/tone profile in the repo for scripting — `marketing/context.md` covers brand voice broadly and points to Jasper's writing-style for prose, but nothing scripting-specific (cadence, sentence shape, hook patterns, on-camera voice).
2. Finn occasionally pastes a draft into Claude for ideas or refinement
    - Actor: Finn
    - System: Claude (generic chat)
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Ad-hoc, not a slash command or skill. Output quality is limited because Claude has no captured "Finn-voice" reference to imitate.

**Automation summary**

- Steps automated: 0 of 2
- Manual gaps:
    - Step 1 — script writing is fully human
    - Step 2 — pasting into generic Claude is manual and uncalibrated to Finn's voice
- Existing skills involved: none
- Trigger mix: Manual 1, Event 0, Scheduled 0, None 1

---

#### Scheduling / posting

**How we achieve this task today**

Scheduling and posting is fully manual. Finn takes finished content and uploads/publishes it directly on each platform (Instagram, TikTok, YouTube, LinkedIn), occasionally using LinkedIn's native scheduler for LinkedIn posts. No third-party scheduling tools and no automation.

**Steps**

1. Take a finished piece of content and decide where it goes
    - Actor: Finn
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: none
2. Post to Instagram manually
    - Actor: Finn
    - System: Instagram
    - Existing automation: none
    - Trigger type: None
    - Notes: Hit publish directly, no scheduling.
3. Post to TikTok manually
    - Actor: Finn
    - System: TikTok
    - Existing automation: none
    - Trigger type: None
    - Notes: Hit publish directly, no scheduling.
4. Post to YouTube manually
    - Actor: Finn
    - System: YouTube
    - Existing automation: none
    - Trigger type: None
    - Notes: Hit publish directly, no scheduling.
5. Post to LinkedIn (manual publish or native scheduler)
    - Actor: Finn
    - System: LinkedIn
    - Existing automation: none
    - Trigger type: None
    - Notes: Occasionally uses LinkedIn's built-in scheduler; otherwise hits publish directly.

**Automation summary**

- Steps automated: 0 of 5
- Manual gaps:
    - Step 1 — decision is human
    - Steps 2–5 — every platform upload + publish is a manual Finn action with no scheduler in the loop (LinkedIn's native scheduler is the only occasional assist)
- Existing skills involved: none
- Trigger mix: Manual 0, Event 0, Scheduled 0, None 5

---

#### Editing

**How we achieve this task today**

Finn edits all videos himself in CapCut. The work is fully manual — no AI or automation involved. If we were ever to take this off Finn, the realistic move is outsourcing to a human editor rather than automating it, because AI editing isn't good enough yet.

**Steps**

1. Finn edits raw footage in CapCut (cuts, sequencing, captions, polish) and exports the finished video
    - Actor: Finn
    - System: CapCut
    - Existing automation: none
    - Trigger type: None
    - Notes: Finn has editing experience so it's faster than it would be otherwise, but it still takes meaningful time. Not a candidate for AI automation at current quality bar — outsourcing to a human editor is the more realistic path if Finn ever steps out of the seat.

**Automation summary**

- Steps automated: 0 of 1
- Manual gaps:
    - Step 1 — full edit is hands-on in CapCut; AI editing not yet good enough, future relief is outsourcing rather than automation
- Existing skills involved: none
- Trigger mix: Manual 0, Event 0, Scheduled 0, None 1

---

#### Research

**How we achieve this task today**

Finn manually scans YouTube, TikTok, and Instagram for what's happening in the AI/agent space, following a handful of big-name creators. A recently-built research skill (`marketing-content-research` + sub-skills) scrapes newsletters, dev blogs, and YouTube uploads from a curated channel list, but Finn isn't confident it's actually firing on a schedule. He wants a new YouTube transcript-scribe skill that ingests transcripts, breaks them down through Minimise's lens, and surfaces gaps + build ideas that could feed the plans folder.

**Steps**

1. Manually scan YouTube for what big-name creators in the space are posting
    - Actor: Finn
    - System: YouTube
    - Existing automation: none
    - Trigger type: None
    - Notes: Ad-hoc, no cadence. Overlaps with what `marketing-research-youtube` already does for a curated channel list, but Finn still does it by eye.
2. Manually scan TikTok for content/ideas in the space
    - Actor: Finn
    - System: TikTok
    - Existing automation: none
    - Trigger type: None
    - Notes: Phase 1.5 in the routine plan flags a `marketing-research-tiktok` Apify sub-skill but it's not built.
3. Manually scan Instagram for content/ideas in the space
    - Actor: Finn
    - System: Instagram
    - Existing automation: none
    - Trigger type: None
    - Notes: Same as TikTok — Phase 1.5 `marketing-research-instagram` sub-skill is on the roadmap, not built.
4. Run the research skill that scrapes the web, newsletters, and big-name creators
    - Actor: `marketing-content-research`
    - System: Claude Code (skill) + minimise-intel repo + Slack
    - Existing automation: `marketing-content-research` (orchestrator) → `marketing-research-articles` + `marketing-research-youtube` (`marketing-research-social` built but deferred — needs Apify paid plan)
    - Trigger type: Scheduled
    - Notes: A launchd plist (`co.minimise.content-research`) exists targeting Mon 10am NZT via `~/.local/bin/minimise-content-research.sh`, but Finn isn't sure it's actually firing. Verify install + Monday-morning Slack DM. He also still triggers it manually.
5. (Wanted, not built) Ingest YouTube transcripts on demand, break them down through the Minimise lens, compare against current capability, and surface build ideas that link back to `.claude/plans/`
    - Actor: Finn (today, manually); planned skill (e.g. `marketing-youtube-transcript-scribe`) tomorrow
    - System: Claude Code (skill) + `.claude/plans/`
    - Existing automation: none
    - Trigger type: Manual (planned)
    - Notes: Closest existing pattern is `marketing-transcript-ingest`, but that's for Finn's own CapCut/screen recordings — different purpose. This would be inbound third-party transcripts → structured breakdown → gap analysis → plan-folder candidates.

**Automation summary**

- Steps automated: 1 of 5 (step 4; partially — scheduled but unverified, and social stream deferred)
- Manual gaps:
    - Step 1 — YouTube eyeballing duplicates `marketing-research-youtube`'s job
    - Step 2 — no TikTok scraper
    - Step 3 — no Instagram scraper
    - Step 5 — transcript-scribe skill doesn't exist
- Existing skills involved: `marketing-content-research`, `marketing-research-articles`, `marketing-research-youtube`, `marketing-research-social` (deferred)
- Trigger mix: Manual 0, Event 0, Scheduled 1, None 4

### Delivery
_To be captured._

### Relationships

#### Client communications

**How we achieve this task today**

Active-client communications are mostly ad-hoc — the team has to remember to check in, follow up on system performance, or chase outstanding items. `sales-outreach-run` handles cold-outreach prospects and `clickup-daily` surfaces tasks due today, but neither proactively flags stale active-client relationships or drafts check-ins. There is no skill yet that owns ongoing client comms.

**Steps**

1. Remember (manually) that a given active client hasn't been contacted in a while
    - Actor: Finn / Jasper / Ziv
    - System: memory / gut feel
    - Existing automation: none
    - Trigger type: None
    - Notes: No stale-client detector; relies on humans noticing a gap.
2. Open the client's `overview.md` and intel folder to recall context (last touchpoint, system status, open threads)
    - Actor: Finn / Jasper / Ziv
    - System: `minimise-brain` + `minimise-intel/relationships/<slug>/`
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Context lookup is fine, but only triggered after step 1's manual prompt.
3. Pull recent system performance (bookings, calls, sentiment) to know what to talk about
    - Actor: Ziv (or `relationships-client-reporting` if invoked)
    - System: Supabase
    - Existing automation: `relationships-client-reporting`
    - Trigger type: Manual
    - Notes: Skill exists but only fires when someone explicitly asks for a report; not wired into a routine.
4. Draft the email / message
    - Actor: `email-draft`
    - System: Gmail
    - Existing automation: `email-draft`
    - Trigger type: Manual
    - Notes: Works well per-email, but each invocation requires a human to decide who and when.
5. Send and log the touchpoint (often skipped — no central log for active-client touchpoints)
    - Actor: Finn / Jasper / Ziv
    - System: Gmail / WhatsApp / phone
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Outreach-tab touchpoint logging only applies to cold prospects; active clients have no equivalent log.
6. Track replies and follow up on threads in flight
    - Actor: Finn / Jasper / Ziv
    - System: Gmail inbox
    - Existing automation: none
    - Trigger type: Manual
    - Notes: No auto-detection of overdue replies on client threads.

**Automation summary**

- Steps automated: 2 of 6 (and only as on-demand executors, not proactive triggers)
- Manual gaps:
    - No stale-client detector (no "haven't contacted Wright in 21 days" surfacing)
    - No scheduled cadence for proactive check-ins per client
    - No active-client touchpoint log (parallel to the Outreach-tab Notes structure)
    - No overdue-reply detector for client threads
    - `relationships-client-reporting` isn't wired into a routine
- Existing skills involved: `email-draft`, `relationships-client-reporting`, `clickup-daily` (tangentially)
- Trigger mix: Manual 5, Event 0, Scheduled 0, None 1

---

#### Client reporting

**How we achieve this task today**

We don't. There's a `relationships-client-reporting` skill in the repo but it isn't wired up or used by anyone, and no one is sending reports manually either. This is a known operational gap that needs to be rebuilt around the AI OS transition — future state is a client-facing dashboard that auto-updates plus an end-of-month report.

**Steps**

1. No process exists — client reporting is not happening
    - Actor: none
    - System: —
    - Existing automation: `relationships-client-reporting` (stub only, unused, likely to be deleted/rewritten)
    - Trigger type: None
    - Notes: Skill defines a Supabase-based flow but isn't invoked; no client has ever received a report; gap acknowledged.

**Automation summary**

- Steps automated: 0 of 1
- Manual gaps: Entire workflow — no data pull, no narrative generation, no delivery
- Existing skills involved: `relationships-client-reporting` (stub, unused, candidate for delete/rewrite during AI OS transition)
- Trigger mix: Manual 0, Event 0, Scheduled 0, None 1

### Operations

#### Task management / prioritisation

**How we achieve this task today**

Tasks live exclusively in ClickUp, created mostly via ad-hoc Claude prompts from Finn, Jasper, or Ziv — with no shared conventions for list, status, assignee, or due date. The `clickup-daily` skill exists to pull each person's queue but is incomplete and never invoked or scheduled, so daily prioritisation is done manually by gut feel with no data-driven signal, no active watcher on the CRM, and no reliable mechanism for closing completed work.

**Steps**

1. Task gets created in ClickUp via ad-hoc Claude prompt ("hey can you make sure we do this")
    - Actor: Finn / Jasper / Ziv
    - System: ClickUp
    - Existing automation: none
    - Trigger type: Manual
    - Notes: No task-creation convention or instruction file — Claude infers list/status/assignee/due date with no guardrails. Big gap.
2. Task gets created automatically as a subtask after a virtual sales call
    - Actor: `process-call`
    - System: ClickUp Pipeline
    - Existing automation: `process-call`
    - Trigger type: Event
    - Notes: Only fires for virtual calls — covers a narrow slice of task creation.
3. Task gets created/pushed when an outreach lead books a meeting
    - Actor: `sales-outreach-run`
    - System: ClickUp Pipeline (from Outreach sheet)
    - Existing automation: `sales-outreach-run`
    - Trigger type: Manual
    - Notes: Sales pipeline only; doesn't cover non-sales task creation.
4. Decide what to work on each day
    - Actor: Finn / Jasper / Ziv
    - System: ClickUp (eyeballed)
    - Existing automation: none
    - Trigger type: Manual
    - Notes: No prioritisation logic, no data signal, each person decides individually — `clickup-daily` skill exists for this but is incomplete and unused.
5. Pull today's queue + draft comms follow-ups + flag stale parents
    - Actor: `clickup-daily`
    - System: ClickUp + Gmail + Calendar
    - Existing automation: `clickup-daily`
    - Trigger type: None
    - Notes: Skill is incomplete, not invoked by anyone, not scheduled — intended trigger phrases never fire in practice.
6. Close subtasks when work is done
    - Actor: Finn / Jasper / Ziv (sometimes a skill, inconsistently)
    - System: ClickUp
    - Existing automation: none (some skills occasionally close their own subtasks, no guarantee)
    - Trigger type: Manual
    - Notes: No reliable close-out — Claude lacks context to confirm completion, stuff stays open.
7. Active CRM watcher pinging us about priorities, stale items, missed updates
    - Actor: none
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: Purely future state — biggest identified gap, would replace the manual-decision step entirely.

**Automation summary**

- Steps automated: 2 of 7 (only the two event-driven creators — `process-call` and `sales-outreach-run`)
- Manual gaps:
    - Ad-hoc task creation has no convention or instruction file — Claude guesses fields
    - Daily prioritisation is gut-feel with no data signal
    - `clickup-daily` skill is incomplete and never invoked / never scheduled
    - Task close-out is inconsistent — no skill reliably marks subtasks done after the work happens
    - No active CRM watcher proactively flagging stale work, priorities, or missed updates
- Existing skills involved: `process-call`, `sales-outreach-run`, `clickup-daily` (unused)
- Trigger mix: Manual 4, Event 1, Scheduled 0, None 2

---

#### CRM management

**How we achieve this task today**

CRM management is implicit, not owned. Three skills (`process-call`, `email-draft`, `sales-outreach-run`) write to ClickUp Pipeline as a side effect of their primary job, and `clickup-daily` surfaces today's queue + flags stale parents — but no skill is dedicated to ensuring the pipeline stays clean, accurate, and moving. Drift is caught ad-hoc when Finn or Jasper notices.

**Steps**

1. New prospect gets promoted into ClickUp Pipeline when a meeting is booked from outreach
    - Actor: `sales-outreach-run`
    - System: ClickUp + Google Sheets (Outreach)
    - Existing automation: `sales-outreach-run`
    - Trigger type: Manual
    - Notes: Operator-confirmed creation; sheet row removed after promotion. Reliable when invoked but depends on operator running the skill.
2. Virtual-call outcome syncs the prospect's Pipeline task (status change, subtasks, owner, due date)
    - Actor: `process-call`
    - System: ClickUp
    - Existing automation: `process-call`
    - Trigger type: Event (transcript paste / verbal sendover)
    - Notes: Only fires for virtual calls. Casual lead mentions, phone notes, and email threads are NOT covered — CLAUDE.md says do this manually, which means it often doesn't happen.
3. Email drafting pulls Pipeline context + (sometimes) leaves Pipeline updates
    - Actor: `email-draft`
    - System: ClickUp + Gmail
    - Existing automation: `email-draft`
    - Trigger type: Manual
    - Notes: Read-heavy, write-light. Updates are inconsistent — Finn flagged this isn't well-defined.
4. Daily queue surfaces today's tasks + flags parents stuck at the same status for 5+ days
    - Actor: `clickup-daily`
    - System: ClickUp + Gmail + Calendar
    - Existing automation: `clickup-daily`
    - Trigger type: Manual
    - Notes: Closest thing to CRM hygiene we have, but it's a queue runner, not a CRM manager. No proactive scheduling.
5. Pipeline lifecycle moves (Prospect → Active Client → Archived) — folder `git mv` + overview metadata + index updates
    - Actor: Finn / Jasper
    - System: Repo (`relationships/`) + ClickUp
    - Existing automation: none
    - Trigger type: Manual
    - Notes: `process-call` detects the signal but never executes the move. Repo and ClickUp can drift apart silently.
6. Detect stale pipeline state, missing fields, duplicate entries, orphaned tasks, sales-relevant chatter that never made it to the CRM
    - Actor: Finn / Jasper (ad-hoc, by eye)
    - System: ClickUp
    - Existing automation: none
    - Trigger type: None
    - Notes: This is the missing skill Finn called out — no automated audit, no scheduled hygiene pass, no notifier.

**Automation summary**

- Steps automated: 4 of 6 (and step 3 only partially)
- Manual gaps:
    - No CRM hygiene/audit skill — stale tasks, missing fields, duplicates, orphan rows go undetected
    - Casual lead mentions / phone-call notes / email threads don't auto-sync to Pipeline (CLAUDE.md says manual; relies on memory)
    - Lifecycle folder moves (Prospect → Active → Archived) are always manual; brain and ClickUp drift
    - Existing CRM-writing skills aren't audited for consistency — Finn unsure they all update Pipeline reliably
- Existing skills involved: `process-call`, `email-draft`, `sales-outreach-run`, `clickup-daily`
- Trigger mix: Manual 3, Event 1, Scheduled 0, None 2

**Hours estimate**

- Manual today: 1.5 hrs/week
- Automated (post-build): 0 hrs/week
- Hours saved per week if fully automated: 1.5 hrs/week

---

#### AIOS maintenance (skills + hooks)

**How we achieve this task today**

We don't, really. The only deliberate maintenance touchpoint is using `skill-builder` (sometimes preceded by `/explore`) when building a new skill from scratch. Everything else — fixing broken skills, pruning dead ones, keeping hooks / `reference.md` / `CLAUDE.md` in sync, drift auditing — is either reactive (caught mid-session by accident) or not happening at all.

**Steps**

1. New skill gets built
    - Actor: Finn (occasionally Jasper / Ziv)
    - System: Claude Code session
    - Existing automation: `skill-builder` (sometimes `/explore` for planning first)
    - Trigger type: Manual
    - Notes: No review step before it goes live; no end-to-end test required despite the skill-spec checklist.
2. New skill registered in `CLAUDE.md` Available Skills table
    - Actor: Finn
    - System: `.claude/CLAUDE.md`
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Required by skill-spec checklist; no enforcement — easy to forget.
3. `reference.md` updated when a skill introduces a new MCP tool, hardcoded ID, or routing pattern
    - Actor: Finn
    - System: `.claude/reference.md`
    - Existing automation: none
    - Trigger type: None
    - Notes: Spec says it's required ("this file rots fast otherwise") but no enforcement; drift unchecked.
4. Skill misfires in production
    - Actor: none
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: Silent rot — only discovered mid-session when a teammate happens to trigger it. No alerting, no testing, no logging.
5. Broken skill gets fixed
    - Actor: Finn (whoever caught it)
    - System: Claude Code session
    - Existing automation: none (`skill-builder` exists but is build-oriented, not repair-oriented)
    - Trigger type: Manual
    - Notes: Self-annealing protocol in skill-spec says add a `## Learnings` entry — relies on memory.
6. SKILL.md updated when actual behaviour drifts from documented behaviour
    - Actor: none
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: No comparison between what skills say they do vs what they're doing.
7. Dead / unused skills pruned
    - Actor: none
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: No usage tracking → no signal for what's dead.
8. Hooks (`.claude/hooks/`, `.claude/settings.json`) updated / audited
    - Actor: none
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: Current state is just `session-start-pull.sh` + a pre-push rebase hook; nobody reviewing whether more hooks are warranted.
9. `CLAUDE.md` kept in sync with structural changes
    - Actor: Finn (when remembered)
    - System: `.claude/CLAUDE.md`
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Memory rule says "don't touch CLAUDE.md unless clear reason" — so updates lag structural changes.
10. Drift audit — flag stale `data/README.md` files, loose top-level files outside layer subfolders, missing layer subfolders, dead skills
    - Actor: none
    - System: —
    - Existing automation: none — Phase 8 in `aios-rollout.md` is Pending and not yet specced
    - Trigger type: None
    - Notes: Concept exists in rollout plan but not built; Finn doesn't currently have a mental model of what it would do.
11. Memory pointers (`~/.claude/projects/.../memory/`) updated after structural changes
    - Actor: Finn
    - System: Auto-memory files
    - Existing automation: none (memory protocol in CLAUDE.md drives this, but it's still manual)
    - Trigger type: Manual
    - Notes: Works when remembered, otherwise stale.

**Automation summary**

- Steps automated: 0 of 11 (`skill-builder` partially assists step 1 but it's still human-driven)
- Manual gaps:
    - No skill misfire detection → silent rot until someone trips over it (step 4)
    - No `reference.md` drift enforcement despite spec calling it required (step 3)
    - No SKILL.md vs actual-behaviour reconciliation (step 6)
    - No usage tracking → can't identify dead skills (step 7)
    - Hooks / `settings.json` have no review cadence (step 8)
    - Phase 8 drift audit unbuilt and unspecced (step 10)
    - New-skill registration in `CLAUDE.md` relies on human memory (step 2)
- Existing skills involved: `skill-builder`, `/explore` (planning aid only)
- Trigger mix: Manual 5, Event 0, Scheduled 0, None 6

**Future build-out (not yet built)**

- **Drift audit skill** (Phase 8 in `aios-rollout.md`) — Scheduled weekly; checks stale `data/README.md` (>60d), loose top-level files outside layer subfolders, missing layer subfolders, skills not in `CLAUDE.md` table, MCP tools used in skills but absent from `reference.md`. Surface results in daily brief or Friday "structure health" line.
- **Skill misfire detection** — Event-triggered post-skill-run hook that logs skill name + outcome + any error to a `skill-runs.jsonl`, plus a weekly digest of failures.
- **Skill usage tracker** — feeds dead-skill pruning. Count invocations per skill from logs; flag any skill not run in 30/60 days.
- **SKILL.md ↔ behaviour reconciliation** — scheduled monthly skill that reads each SKILL.md and compares declared triggers + process steps against recent runs, flags divergence.
- **Auto-register new skills** — hook on `.claude/skills/*/SKILL.md` create event that opens a PR adding the row to `CLAUDE.md`'s Available Skills table and `reference.md` if new MCP tools / IDs are introduced.
- **Hook health check** — scheduled monthly skill that lists active hooks, when each last fired, whether the referenced script still exists.

---

#### Security + credential hygiene

**How we achieve this task today**

There is no formal process. Secrets live wherever they were first set up (local dotfiles, browser-saved OAuth, claude.ai-hosted MCP, individual heads), there is no rotation cadence, no team-wide vault, no secret-scanning on commit, and no audit log. The only active protection is `.gitignore` entries and a one-line CLAUDE.md guardrail.

**Steps**

1. Local secret storage (Google OAuth pickle, Miro token, Supabase keys when needed)
    - Actor: Finn
    - System: `~/.minimise/`, `~/Downloads/` (`client_secret` JSON)
    - Existing automation: none
    - Proposed automation: `dev-secrets-vault-migrate` skill — sweeps `~/Downloads/` and loose `~/.minimise/` files into a single controlled path (or 1Password vault), logs an inventory entry per secret
    - Trigger type: Manual
    - Notes: Ad-hoc paths; `client_secret` left in Downloads; no encryption at rest beyond macOS user account.
2. Client-system credentials (Retell, n8n, Supabase, ClickSend, Cal.com, Postmark, Drop Cowboy)
    - Actor: Ziv
    - System: Supabase Vault, per-tool dashboards
    - Existing automation: none
    - Proposed automation: `dev-client-creds-inventory` skill — reads Supabase Vault + each vendor and writes a `dev/data/credential-inventory.md` map (what key, what client, what scope, last-rotated date) without exposing the secret values
    - Trigger type: Manual
    - Notes: Convention exists ("Sensitive tokens in Supabase Vault") but no enforcement, no inventory of what is where.
3. Team-shared service credentials (any keys 2+ teammates need)
    - Actor: none
    - System: none
    - Existing automation: none
    - Proposed automation: Adopt 1Password (or Bitwarden) team vault first; then `dev-shared-creds-grant` skill — adds/removes a teammate's access, posts the diff to Slack, logs in `dev/data/access-log.md`
    - Trigger type: None
    - Notes: No password manager in use. Sharing happens via Slack/DM when asked.
4. Repo protection against accidental commit of secrets
    - Actor: Finn
    - System: `.gitignore`
    - Existing automation: none
    - Proposed automation: `.claude/hooks/pre-commit-secret-scan.sh` (PreToolUse hook on `Bash(git commit*)`) running `gitleaks` or `trufflehog` against the staged diff; blocks the commit on a hit. Plus enable GitHub secret scanning + push protection on the remote.
    - Trigger type: Event
    - Notes: No pre-commit hook today; CLAUDE.md guardrail is advisory only.
5. New-tool onboarding (MCP server, SaaS, client integration)
    - Actor: Finn or Ziv
    - System: claude.ai MCP, vendor dashboards
    - Existing automation: none
    - Proposed automation: `dev-tool-onboard` skill — walks a checklist (where the key goes, scope minimisation, who else needs access, rotation date) and appends to the credential inventory
    - Trigger type: Manual
    - Notes: No checklist today.
6. Secret rotation
    - Actor: none
    - System: none
    - Existing automation: none
    - Proposed automation: `dev-creds-rotation-check` scheduled skill (launchd weekly) — reads the credential inventory, flags anything older than its rotation interval, opens a ClickUp task + Slack DM with the rotation steps
    - Trigger type: Scheduled
    - Notes: Tokens stay live until they break.
7. Access review / offboarding
    - Actor: none
    - System: none
    - Existing automation: none
    - Proposed automation: `dev-offboard` skill — given a teammate name, generates a revoke checklist (Google Workspace, GitHub, ClickUp, 1Password, Supabase, claude.ai MCP, vendor dashboards) and tracks completion in ClickUp
    - Trigger type: Manual
    - Notes: No process today. Ziv holds most client creds; no documented handover.
8. Incident response (leaked key, accidental push, vendor breach email)
    - Actor: none
    - System: none
    - Existing automation: none
    - Proposed automation: `dev-secret-incident` skill — given a leaked-key alert, produces the revoke-and-rotate plan, kicks off rotation via the inventory, writes a post-incident note to `dev/intelligence/`
    - Trigger type: Manual
    - Notes: No playbook today.
9. Prospect-facing leakage prevention (webhook URLs, schemas, keys in proposals/decks/emails)
    - Actor: Finn, Jasper
    - System: human review
    - Existing automation: none
    - Proposed automation: `dev-outbound-scrub` shared utility called by `sales-proposal-gen`, `sales-overview-gen`, `email-draft`, `process-call` — scans the generated artefact for internal patterns (Retell IDs, Supabase URLs, webhook tokens, Cal.com private links, raw API keys) and blocks send / flags for review
    - Trigger type: Event
    - Notes: CLAUDE.md guardrail relies on the operator remembering.
10. Audit log of who accessed what
    - Actor: none
    - System: none
    - Existing automation: none
    - Proposed automation: `dev-access-log` scheduled skill — pulls Google Workspace admin audit, GitHub audit, ClickUp activity, claude.ai MCP usage; writes a weekly digest into `dev/intelligence/access-log/` and pings Slack on anomalies
    - Trigger type: Scheduled
    - Notes: Per-vendor logs exist but nothing aggregated.

**Automation summary**

- Steps automated: 0 of 10
- Manual gaps:
    - No team secret vault — shared creds live in heads / DMs
    - No pre-commit secret scanning — `.gitignore` is the only defence
    - No rotation cadence — tokens live indefinitely
    - No onboarding checklist for new tools/integrations
    - No offboarding / access-review process
    - No incident-response playbook
    - No automated scrub of outbound assets (proposals, decks, emails) for internal identifiers
    - No central inventory of which secret lives where
    - No expiry / renewal tracking for OAuth tokens and API keys
    - `client_secret` JSON sitting in `~/Downloads/` rather than a controlled path
- Existing skills involved: none
- Trigger mix (today): Manual 5, Event 0, Scheduled 0, None 5
- Trigger mix (proposed): Manual 6, Event 2, Scheduled 2, None 0

**Future build-out (not yet built)**

- **`dev-secrets-vault-migrate`** (Manual) — sweep loose local secrets into a controlled path / 1Password
- **`dev-client-creds-inventory`** (Manual) — generate the credential map from Supabase Vault + vendors
- **`dev-shared-creds-grant`** (Manual) — grant / revoke team-vault access with Slack + log
- **pre-commit-secret-scan hook** (Event) — `gitleaks` / `trufflehog` on `git commit`
- **`dev-tool-onboard`** (Manual) — checklist for every new MCP / SaaS / client integration
- **`dev-creds-rotation-check`** (Scheduled, weekly launchd) — flag stale keys, open ClickUp + Slack
- **`dev-offboard`** (Manual) — revoke checklist when a teammate leaves
- **`dev-secret-incident`** (Manual) — leak / breach response playbook
- **`dev-outbound-scrub`** (Event) — internal-identifier scan inside `sales-proposal-gen`, `sales-overview-gen`, `email-draft`, `process-call`
- **`dev-access-log`** (Scheduled, weekly) — aggregated audit digest + anomaly ping

---

#### Repo hygiene

**How we achieve this task today**

There is no real process. Finn cleans up ad-hoc, only when the repo feels overcomplicated. No skill, no scheduled audit, no enforcement of the AIOS layer pattern — files just land wherever Claude (or a teammate) puts them at write time, and drift is caught by eyeball.

**Steps**

1. Finn notices the repo feels overwhelming / cluttered during normal work
    - Actor: Finn
    - System: —
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Reactive only — no defined cadence, no signal beyond "this feels messy".
2. Finn manually tidies whatever caught his eye (move files, delete stale ones, rename)
    - Actor: Finn
    - System: Finder / VSCode / Claude session
    - Existing automation: none
    - Trigger type: Manual
    - Notes: No checklist, no structural pass — fixes whatever's bugging him, leaves the rest.
3. New files get routed at write time by Claude using `CLAUDE.md`'s AIOS Layer Pattern + Writing to Files rules
    - Actor: claude (in-session)
    - System: `CLAUDE.md` routing rules
    - Existing automation: none (rule-based, not enforced)
    - Trigger type: Event
    - Notes: Relies on Claude following the rule every time; no audit catches misses.
4. Commit + push reminder after file changes
    - Actor: claude (in-session)
    - System: git / `CLAUDE.md` Git Rule
    - Existing automation: none (prompt-based)
    - Trigger type: Event
    - Notes: Per `CLAUDE.md`, Claude is supposed to prompt the user to commit after meaningful changes; not always actioned.
5. Session-start git pull check
    - Actor: hook
    - System: `.claude/hooks/session-start-pull.sh`
    - Existing automation: `session-start-pull` hook
    - Trigger type: Event
    - Notes: Warns when repo is behind `origin` + has uncommitted changes; doesn't actually clean anything.
6. Periodic drift audit — flag loose files at dept roots, stale `data/README.md` (>60 days), missing layer subfolders, files that shouldn't exist, context bloat
    - Actor: none
    - System: —
    - Existing automation: none — planned as AIOS Phase 8 in `.claude/plans/aios-rollout.md` (Pending)
    - Trigger type: None
    - Notes: Finn explicitly flagged this gap — wants an agent that validates new files land in the right layer, checks they're concise, and asks whether they need to exist at all.

**Automation summary**

- Steps automated: 2 of 6 (session-start pull warning + in-session routing rule — both partial / advisory, neither enforces hygiene)
- Manual gaps:
    - No scheduled drift audit (planned Phase 8, not built)
    - No enforcement that new files land in the correct layer (routing is rule-based, not validated)
    - No check on file conciseness / "does this need to exist"
    - No detection of stale `data/README.md` or orphaned plans/skills
    - No cadence — cleanup is purely reactive to Finn's overwhelm threshold
- Existing skills involved: none
- Trigger mix: Manual 2, Event 3, Scheduled 0, None 1

---

#### Dashboard control / updates

**How we achieve this task today**

The dashboard (Minimise's own AIOS dashboard + the same pattern for clients) only updates when Finn manually notices it needs to. He edits the `dashboard-data/*.yml` files in a Claude session and triggers the `dashboard-sync` skill, which handles the build + push automatically. There's no process for catching drift, validating hours estimates, or prompting updates — the whole control layer is reactive.

**Steps**

1. Decide the dashboard needs updating (new skill shipped, new idea to surface, or counts feel stale)
    - Actor: Finn
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: No prompt or signal — relies on Finn remembering. Same gap for the client version of this dashboard.
2. Edit `dashboard-data/skills.yml` to add/change a skill row (display name, dept, status, mode, description)
    - Actor: Finn
    - System: `dashboard-data/skills.yml`
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Done inside a Claude session — Claude edits the YAML, Finn confirms.
3. Edit `dashboard-data/tasks.yml` to add tasks, fill `manual_hours_per_week` / `automated_hours_per_week`, and tick `automated_by`
    - Actor: Finn
    - System: `dashboard-data/tasks.yml`
    - Existing automation: none
    - Trigger type: Manual
    - Notes: Covers both "just shipped" tasks and "want to build later" ideas. Hours estimates often left null and rarely backfilled.
4. Say "sync the dashboard" in a Claude session
    - Actor: Finn
    - System: Claude Code
    - Existing automation: `dashboard-sync`
    - Trigger type: Manual
    - Notes: Verbal trigger — no reminder if Finn forgets to do this after editing YAML.
5. Run `build_jsons.py` to produce `dashboard.json` + `tasks.json` in `/tmp/dashboard-sync/`
    - Actor: `dashboard-sync`
    - System: Python script
    - Existing automation: `dashboard-sync`
    - Trigger type: Event
    - Notes: Validates orphan ticks, unknown depts, missing skill folders. Fails loud — won't push partial data.
6. Commit `dashboard.json` + `tasks.json` to `finn-a11y/minimise-aios-dashboard` via GitHub MCP
    - Actor: `dashboard-sync`
    - System: GitHub MCP
    - Existing automation: `dashboard-sync`
    - Trigger type: Event
    - Notes: Single commit with both files. Netlify auto-rebuilds within ~60s.
7. Report commit URL + diff summary back to Finn
    - Actor: `dashboard-sync`
    - System: Claude Code
    - Existing automation: `dashboard-sync`
    - Trigger type: Event
    - Notes: none
8. Audit drift — confirm every live skill in `.claude/skills/` has a row, hours estimates are still right, dead skills marked killed
    - Actor: Finn
    - System: —
    - Existing automation: none
    - Trigger type: None
    - Notes: Doesn't happen. No scheduled audit, no prompt, no diff job comparing `.claude/skills/*` against `skills.yml`. Same gap for client dashboards.

**Automation summary**

- Steps automated: 3 of 8
- Manual gaps:
    - Step 1 — no signal/reminder when dashboard goes stale (could be a weekly nudge or a post-skill-ship hook)
    - Step 2 — YAML edits are hand-rolled even though a "ship a new skill" event could auto-draft the `skills.yml` row
    - Step 3 — same as step 2; could be auto-drafted when a new skill folder appears
    - Step 4 — sync requires a verbal trigger; no post-edit hook to auto-run it
    - Step 8 — no drift audit job comparing live skills folder vs `skills.yml` vs `tasks.yml`
- Existing skills involved: `dashboard-sync`
- Trigger mix: Manual 3, Event 3, Scheduled 0, None 2

### Development

#### Workflow building

**How we achieve this task today**

n8n is Minimise's workflow-orchestration backbone for client systems. The `dev-n8n-workflow` skill encodes n8n best practices and gets invoked whenever a workflow needs building, debugging, or reviewing. Today it's a manual, on-demand skill — Ziv (primary owner) types the trigger and Claude assists; nothing watches the n8n instance for broken flows or pushes templated workflows automatically.

**Steps**

1. Build, debug, or review an n8n workflow on demand
    - Actor: `dev-n8n-workflow`
    - System: Claude Code (skill) + n8n
    - Existing automation: `dev-n8n-workflow`
    - Trigger type: Manual
    - Notes: Loaded with n8n best practices; produces working JSON / suggestions. Owner is Ziv; Finn/Jasper rarely invoke. No auto-discovery of n8n issues — has to be requested.

**Automation summary**

- Steps automated: 1 of 1
- Manual gaps:
    - No watcher on the n8n instance to surface failing workflows proactively
    - No template library that auto-applies to new client builds
- Existing skills involved: `dev-n8n-workflow`
- Trigger mix: Manual 1, Event 0, Scheduled 0, None 0

---

#### System monitoring

**How we achieve this task today**

There is no live monitoring layer for deployed Speed-to-Lead / Lead Reactivation systems. Failures are caught when a client emails to say "the bot stopped responding" or when Ziv notices something off in n8n logs. Per-client health metrics (response time, conversion rate, error rate) are not aggregated; no weekly product roll-up exists either.

**Steps**

1. Per-client system health monitoring (response time, conversion, error rate)
    - Actor: none
    - System: Retell + n8n + Supabase + per-client dashboards
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. No central health view across deployed systems; metrics live in each vendor silo.
2. Detect when a deployed Speed-to-Lead system breaks (no inbound webhook for N hours, error rate spike, AI call failure rate)
    - Actor: none
    - System: Supabase / n8n logs / Retell
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. Failures are caught reactively — usually by the client noticing.
3. Weekly product metrics roll-up (across all deployed clients)
    - Actor: none
    - System: Supabase + ClickUp
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. No scheduled job aggregates pipeline-of-deployed-systems performance into a digest.

**Automation summary**

- Steps automated: 0 of 3
- Manual gaps:
    - No proactive system-break detector
    - No per-client health monitoring layer
    - No weekly product metrics roll-up
- Existing skills involved: none
- Trigger mix: Manual 0, Event 0, Scheduled 0, None 3

---

#### Tech intel

**How we achieve this task today**

Voice AI is moving fast (new platforms, model updates, pricing shifts) and Minimise needs to stay current to make build decisions. The `dev-voice-ai-intel` skill runs a research scan for voice AI news on demand. It's not on a schedule, so it only fires when someone explicitly asks for an intel update.

**Steps**

1. Check the latest voice AI tech and platform news (Retell, ElevenLabs, Vapi, etc.)
    - Actor: `dev-voice-ai-intel`
    - System: Claude Code (skill) + WebSearch / WebFetch
    - Existing automation: `dev-voice-ai-intel`
    - Trigger type: Manual
    - Notes: Marketing tasks.yml row "Schedule voice AI intel weekly" exists for this — wiring it to a scheduled cadence would close the loop. Today it's strictly on-demand.

**Automation summary**

- Steps automated: 1 of 1
- Manual gaps:
    - No scheduled cadence — intel only when someone asks
    - No digest layer aggregating voice AI news into a weekly summary in Slack / brain
- Existing skills involved: `dev-voice-ai-intel`
- Trigger mix: Manual 1, Event 0, Scheduled 0, None 0

### Finance

#### Contracts

**How we achieve this task today**

When a deal closes, the rep asks Claude to generate a service agreement. The `finance-contract-gen` skill fills the Minimise template with prospect details and produces a Google Doc ready for signature. No e-signature integration, no auto-trigger on Won — every contract is a deliberate "create a contract for X" prompt.

**Steps**

1. Generate a filled service agreement Google Doc for a new client
    - Actor: `finance-contract-gen`
    - System: Google Docs
    - Existing automation: `finance-contract-gen`
    - Trigger type: Manual
    - Notes: Works reliably; template lives in Google Drive. No automatic trigger when a ClickUp Pipeline task hits Won — relies on the rep typing the request.

**Automation summary**

- Steps automated: 1 of 1
- Manual gaps:
    - No auto-trigger on a deal hitting Won
    - No e-signature integration (PandaDoc / DocuSign) on the back end
- Existing skills involved: `finance-contract-gen`
- Trigger mix: Manual 1, Event 0, Scheduled 0, None 0

---

#### Invoicing

**How we achieve this task today**

Invoicing happens through Xero (set up but not automated from the brain). When a client invoice goes overdue there is no automated chase — Finn either notices or doesn't. No skill owns invoice generation, follow-up, or payment reconciliation.

**Steps**

1. Chase overdue invoices automatically (reminder email to client, ClickUp task, Slack ping if very stale)
    - Actor: none
    - System: Xero + Gmail
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. Xero has built-in reminders but they aren't configured to Minimise's voice; no escalation logic; no central log of overdue accounts surfaced into the brain.

**Automation summary**

- Steps automated: 0 of 1
- Manual gaps:
    - No automated invoice chase cadence
    - No escalation tier from polite reminder → harder chase → "call the client"
- Existing skills involved: none
- Trigger mix: Manual 0, Event 0, Scheduled 0, None 1

---

#### Financial reporting

**How we achieve this task today**

There is no financial-reporting layer in the brain. Finn checks Xero / Stripe when he wants a snapshot; nothing aggregates MRR, P&L, or runway into a regular digest. The tasks below are gaps, not running processes.

**Steps**

1. Track MRR with a weekly snapshot (active clients × monthly value, churn delta vs last week)
    - Actor: none
    - System: Xero + Stripe + ClickUp (client list)
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. No central MRR view; manual sums when Finn wants the number.
2. Roll up monthly P&L summary (revenue, COGS, OpEx, net) into a brain-readable digest
    - Actor: none
    - System: Xero
    - Existing automation: none
    - Trigger type: None
    - Notes: Gap. Xero reports exist but aren't pulled into the brain or reviewed on a cadence.

**Automation summary**

- Steps automated: 0 of 2
- Manual gaps:
    - No weekly MRR snapshot
    - No monthly P&L roll-up into the brain / Slack
    - No runway / burn-rate visibility
- Existing skills involved: none
- Trigger mix: Manual 0, Event 0, Scheduled 0, None 2

---

## Methodology

Audit walks every area through four steps:
- **A.** Areas → tasks (mapped upfront with Finn)
- **B.** Tasks → steps (Finn walks a fresh terminal through how each task actually runs)
- **C.** Steps → existing skills (terminal cross-checks `.claude/skills/`, hooks, schedules)
- **D.** Triggers — classify each automated step as Manual / Event / Scheduled / None

B, C, and D are bundled per task — the receiver builds steps and skill mapping in the same conversation. The orchestrator (this session) merges each result into the per-area detail above.

## Update cadence

- This doc is updated as each area is walked through (Sales, Marketing, Relationships, Operations, Finance, Development done; Delivery still to go).
- `dashboard-data/tasks.yml` + `skills.yml` updated when a task changes state (built, killed, repriced).
- `dashboard-sync` skill regenerates the public dashboard from the YAMLs after any of the above changes.
