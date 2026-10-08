/* ── Lift Library — data constants ───────────────────────────────
   Static config only. All persisted state lives behind the Store
   abstraction in app.js (see docs/data-layer.md). */

var LB_DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
var LB_IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

/* Category display metadata for the free-exercise-db `category` values. */
var LB_CATEGORIES = [
  { id: 'strength',             label: 'Strength',        icon: 'dumbbell', blurb: 'Barbell, dumbbell, machine and bodyweight lifts' },
  { id: 'powerlifting',        label: 'Powerlifting',    icon: 'medal',    blurb: 'Squat, bench, deadlift and competition lifts' },
  { id: 'olympic weightlifting', label: 'Olympic Lifting', icon: 'zap',     blurb: 'Snatch, clean & jerk and technique work' },
  { id: 'strongman',           label: 'Strongman',       icon: 'flame',     blurb: 'Carries, sleds, stones and odd objects' },
  { id: 'plyometrics',         label: 'Plyometrics',     icon: 'target',    blurb: 'Jumps, bounds and explosive movement' },
  { id: 'cardio',              label: 'Cardio',          icon: 'timer',     blurb: 'Conditioning and engine work' },
  { id: 'stretching',          label: 'Stretching',      icon: 'refresh',   blurb: 'Mobility, flexibility and recovery' }
];

function lbCatLabel(id) {
  for (var i = 0; i < LB_CATEGORIES.length; i++) {
    if (LB_CATEGORIES[i].id === id) return LB_CATEGORIES[i].label;
  }
  return id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Other';
}

/* ── Instagram how-to videos (from Jaden's tracker, Oct 2026) ──
   Keyed by normalized exercise name. Shown in the exercise detail
   sheet and on plan exercises where a link exists. */
var EXERCISE_VIDEOS = {
  "latpulldown": "https://www.instagram.com/reel/Dc9J-EnJlEa/",
  "seatedcablerow": "https://www.instagram.com/reel/Dc9J-EnJlEa/",
  "seatedcablerows": "https://www.instagram.com/reel/Dc9J-EnJlEa/",
  "seatedrow": "https://www.instagram.com/reel/Dc9J-EnJlEa/",
  "legpress": "https://www.instagram.com/reel/DVzbgb_Esr0/",
  "legextensions": "https://www.instagram.com/reel/DUV_oBWkZvp/",
  "legextension": "https://www.instagram.com/reel/DUV_oBWkZvp/",
  "legcurl": "https://www.instagram.com/reel/DWUiBKQD-Yo/",
  "lyinglegcurls": "https://www.instagram.com/reel/DWUiBKQD-Yo/",
  "tricepspushdown": "https://www.instagram.com/reel/DcvmkH5OSYr/",
  "reversefly": "https://www.instagram.com/reel/DcgnMi-II1W/",
  "reverseflyes": "https://www.instagram.com/reel/DcgnMi-II1W/",
  "dumbbellreversefly": "https://www.instagram.com/reel/DcgnMi-II1W/",
  "bicepscurl": "https://www.instagram.com/reel/DSWTKzLASVU/"
};
function normExName(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function exVideo(name) { return EXERCISE_VIDEOS[normExName(name)] || ''; }
