# ForgeDreamsGYM — data layer

**Decision (locked):** this is a free product. All data lives in `localStorage`
on the device. No accounts, no backend, no server phase — ever. Keep it
simple.

## Storage keys

| Key | Contents |
|---|---|
| `liftBuilder.v1` | `{ programs: [...], logs: [...], activePlan: {...} | null, measurements: [...], customExercises: [...] }` — the entire user store |
| `liftBuilder.exdb.v1` | `{ at, data: [...] }` — cached free-exercise-db (876 exercises, ~1MB), refetched when missing/stale |
| `liftBuilder.profile.v1` | `{ name: "..." }` — display name from onboarding, editable in settings |
| IndexedDB `liftBuilder.v1` → `customVideos` | uploaded demo-video blobs for custom exercises, keyed by exercise id (device-local, 50MB cap) |

## Featured plans (the 48 pre-programmed plans)

Static data in `plans.js` (`FEATURED_PLANS`, ids `plan-1`…`plan-48`),
4 equipment categories × 3 styles × 4 schedules (2/3/4/5 days/week).
Each plan: `{ id, num, equipment, equipmentShort, style, styleShort,
daysPerWeek, name, title, days: [{ name, blocks: [...] }] }` where a block
is `{ type: "lift", exercise, dbId, sets, reps }`,
`{ type: "circuit", title, rounds, exercises: [{ exercise, dbId, reps }] }`,
or `{ type: "cardio", text }`. `PLAN_RULES` holds the rest/warm-up guidance
shown on every plan detail page. Featured plans are read-only in the UI;
"Duplicate to My Programs" flattens their lift blocks into an editable
custom program (circuits/cardio don't carry over).

## Committed ("locked in") plan

`activePlan` in the main store: `{ programId, kind: "featured"|"custom",
startDate: "YYYY-MM-DD", weeks: 1..12 }`. Training weekdays for featured
plans come from `TRAIN_WEEKDAYS` (2→Mon/Thu, 3→Mon/Wed/Fri,
4→Mon/Tue/Thu/Fri, 5→Mon–Fri); custom programs train every day. The Home
tab resolves today's training day (or rest day) from this mapping.

## Shapes

Program:
```json
{
  "id": "x...",
  "name": "Heavy Upper Body",
  "tagline": "Push day",
  "exercises": [{ "dbId": "Standing_Military_Press", "name": "Barbell OHP", "sets": 3, "reps": 10 }],
  "createdAt": 123, "updatedAt": 456
}
```

Log:
```json
{
  "id": "x...",
  "date": "2026-10-07",
  "programId": "x...",
  "programName": "Heavy Upper Body",
  "startedAt": "2026-10-07T...",
  "durationSec": 3720,
  "note": "...",
  "items": [{ "exercise": "Barbell OHP", "dbId": "Standing_Military_Press", "set": 1, "weight": "95", "reps": "10" }]
}
```

## Access rule

All UI code goes through the `Store` object in `app.js`
(`getPrograms`, `getProgram`, `saveProgram`, `deleteProgram`,
`duplicateProgram`, `getLogs`, `getLog`, `saveLog`, `deleteLog`,
`updateLogRPE`, `lastExerciseSets`, `getActivePlan`, `setActivePlan`,
`clearActivePlan`, `getName`, `setName`, `getExCache`, `setExCache`).
No direct `localStorage` calls outside `Store` and the exercise-DB
cache helpers.

## Sharing without a backend

Trainers share programs with clients via **shareable links**:

- `shareProgram(id)` builds `https://<host>/<path>#p=<base64url(program JSON)>`
  (program JSON trimmed to `{name, tagline, exercises[]}`).
- Opening a `#p=` link renders an import preview with an
  **"Add to my library"** button, which saves a copy into the
  opener's localStorage. The hash is cleared after import/dismiss.
- Share uses `navigator.share` with a clipboard fallback.

This is the entire multi-device story: no accounts, no sync server.

## Training tools

- **Plate calculator** (`plateCalc`): largest-first greedy over standard
  plates 45/35/25/10/5/2.5 lb, per side. Reachable from the log view.
- **Smart rest timer**: auto-starts when a lift set is completed —
  150s for heavy compounds (squat/bench/deadlift/press variants,
  `COMPOUND_RE`), 75s for accessories. Floating countdown pill with
  Skip, vibrate + WebAudio beep on completion.
- **Warm-up generator** (`buildWarmup`): 2-min general circuit + ramp
  sets (50%×8, 75%×5) off last session's top weight per lift, shown
  pre-workout on the Home plan card.
- **Body measurements**: `{ id, date, type, value, createdAt }` in the
  main store (`measurements: []`); types = bodyweight (lb), chest,
  waist, arms, thighs (in). Trend sparklines on the Progress tab.
  New Store methods: `getMeasurements`, `saveMeasurement`,
  `deleteMeasurement`.

## Rehab Center

Content lives in `rehab.js` (`REHAB_ROUTINES`: shoulders, hips, ankles,
knees, prehab), compiled from sports-medicine research Oct 2026 —
content swaps happen in that file, not in app code. Each routine:
`{ id, name, tagline, icon, about, exercises[] | blocks[], selftest?,
progression?, avoid[], redflags[], science }`; exercises carry
`{ name, sets, reps, freq?, coaching, db }` where `db` is the exact
exercise-DB name for demos (falls back to text coaching when missing).
`rehabRoutineBlocks(r)` flattens a routine to log blocks.
"Add to today's workout" appends `{ type: "rehab" }` blocks to the active
log session (or starts a rehab session); rehab items save as
`kind: "rehab"` — excluded from PR tracking and volume math.
Landing carries the medical disclaimer, the pain-monitoring rule
(≤3–5/10 OK if settled in 24h), and PEACE & LOVE acute-injury guidance.

## Sports science

All computed client-side from `logs`. UI labels stay plain-language
("Projected max", "Training load", "Consistency") — formula names never
appear in the UI.

- **Projected max (Epley):** `weight × (1 + reps/30)`, evaluated per set;
  the best set per exercise per session is the session's value
  (`bestSetE1RM`). Shown on each lift in the log view and as a trend
  line on the Progress tab (`e1rmTrend`). All-time best projected max
  per exercise is a PR category (`allTimeBests`).
- **Session RPE + training load (Foster):** after each save the user taps
  effort 1–10 (`rpe` on the log). Session load = `rpe × duration (min)`
  (needs both; logs missing either are excluded from load math).
  Weekly load = 7-day rolling sum. Monotony = mean / SD of the 7 daily
  loads (rest days count as 0; guarded against SD ≈ 0). Strain =
  weekly load × monotony. Progress shows this week vs last week; a
  >1.5× spike vs last week raises an "ease off" flag.
- **Balance check:** push vs pull and quad vs hamstring volume over the
  last 4 weeks, mapped through the exercise DB's `primaryMuscles`.
  A >1.5× imbalance raises a coaching flag with a blunt, friendly
  nudge ("add more pulling" style).
- **PR tracking:** all-time best weight per exercise + best projected
  max. On save, `findPRs` compares the session's best sets against
  prior bests (a real baseline is required — a first-ever lift is not
  a PR). New PRs get a celebration sheet, same pattern as Jaden's
  tracker.

## Custom exercises (user-created)

Users can create their own exercises from the Library tab or the program
builder picker ("Add custom exercise"). Form: name (required), primary
muscle (picker over the DB muscle list), equipment (barbell / dumbbell /
kettlebell / machine / cable / bodyweight / band / other), how-to notes
(optional, one step per line). Video is optional, two ways: paste a link
(Instagram, YouTube…) shown as a "Watch video" button, or upload from
the device (played inline on the exercise detail sheet).

- Metadata lives in the main store as `customExercises[]`:
  `{ id: "custom_x…", name, muscle, equipment, notes, videoUrl,
  hasVideo, createdAt, updatedAt }`. Store methods: `getCustomExercises`,
  `getCustomExercise`, `saveCustomExercise`, `deleteCustomExercise`.
- Uploaded videos live as blobs in IndexedDB (`liftBuilder.v1` DB,
  `customVideos` object store, keyed by exercise id) via the `VideoStore`
  helper in app.js — device-local, no backend. 50MB cap with a friendly
  error on oversize files.
- `customToDb()` maps a custom record onto the free-exercise-db shape
  (`custom: true`), and `CustomEx` (id → record map) is consulted by
  `exFor()` and `openExerciseSheet()` alongside `EXDB.byId` — so customs
  work identically in library search, the builder picker, logging
  (prefill, coach, projected max), and stats. Custom rows carry a red
  "Custom" chip.
- Edit and delete live on the custom exercise's detail sheet. Deleting
  warns when the exercise is used in programs / has logged sets: programs
  keep the name, sets, and reps (only the saved details unlink); logs
  keep full history by name.
- Shareable `#p=` program links containing a custom exercise degrade
  gracefully on the recipient's device (name-based, no demo) since
  customs are device-local.
