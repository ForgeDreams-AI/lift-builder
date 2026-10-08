# Lift Library — data layer

**Decision (locked):** this is a free product. All data lives in `localStorage`
on the device. No accounts, no backend, no server phase — ever. Keep it
simple.

## Storage keys

| Key | Contents |
|---|---|
| `liftBuilder.v1` | `{ programs: [...], logs: [...] }` — the entire user store |
| `liftBuilder.exdb.v1` | `{ at, data: [...] }` — cached free-exercise-db (876 exercises, ~1MB), refetched when missing/stale |

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
`lastExerciseSets`, `getExCache`, `setExCache`). No direct
`localStorage` calls outside `Store` and the exercise-DB cache helpers.

## Sharing without a backend

Trainers share programs with clients via **shareable links**:

- `shareProgram(id)` builds `https://<host>/<path>#p=<base64url(program JSON)>`
  (program JSON trimmed to `{name, tagline, exercises[]}`).
- Opening a `#p=` link renders an import preview with an
  **"Add to my library"** button, which saves a copy into the
  opener's localStorage. The hash is cleared after import/dismiss.
- Share uses `navigator.share` with a clipboard fallback.

This is the entire multi-device story: no accounts, no sync server.
