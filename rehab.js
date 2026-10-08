/* ── ForgeDreamsGYM — Rehab Center content ──
   Evidence-based routines compiled from sports-medicine research (Oct 2026).
   Plain lifter language up top, named protocols underneath.
   Content swaps in here when guidance updates — app code reads this file. */

var REHAB_DISCLAIMER = "This isn't medical advice — see a professional for real injuries. " +
  "If anything in the red-flags list sounds like you, skip the routine and get checked.";

var PAIN_RULE = {
  title: "The pain rule",
  body: "Some discomfort is OK: up to 3–5/10 during the exercise is fine " +
    "IF it settles back to baseline within 24 hours. Sore or worse the next day " +
    "means you overdid it — back off. Sharp pain, numbness, tingling, or pain " +
    "that changes how you move means stop, not push through."
};

var PEACE_LOVE = {
  title: "Just got hurt? PEACE & LOVE",
  peace: [
    ["Protect", "Unload it for 1–3 days — not weeks in a cast."],
    ["Elevate", "Above heart level when you can."],
    ["Avoid", "Skip routine ice and NSAIDs for the first 48–72 hours — inflammation is how the repair starts. Ice is fine for comfort, but it doesn't speed healing."],
    ["Compress", "Light compression for swelling."],
    ["Educate", "Active recovery beats passive magic cures."]
  ],
  love: [
    ["Load", "Let pain guide a gradual return — loading drives repair."],
    ["Optimism", "Most of these get better. Stay moving."],
    ["Vascularisation", "Easy cardio to keep blood flowing."],
    ["Exercise", "Rehab exercises below, dosed right."]
  ],
  note: "Heat suits chronic tightness and pre-activity warm-ups — not fresh tears or sprains."
};

var REHAB_ROUTINES = [
  {
    id: "shoulders",
    name: "Shoulders",
    tagline: "Rotator cuff–related pain",
    icon: "dumbbell",
    about: "Achy shoulder when you press? In lifters this is usually a load-management " +
      "problem plus a weak rotator cuff and lazy scapular control — not a \"pinch\" that " +
      "needs surgery. First-line fix is exercise: strengthen the cuff, wake up the " +
      "muscles that move your shoulder blade, and temporarily trade pressing volume " +
      "for pulling volume (aim for roughly 2:1 pull-to-push while it calms down).",
    exercises: [
      { name: "Side-Lying External Rotation", sets: 3, reps: "12–15", freq: "3x/week", db: "External Rotation",
        coaching: "Elbow pinned to your ribs, rotate the dumbbell up slow. Light weight — this is a small muscle." },
      { name: "Banded External Rotation", sets: 3, reps: "12–15", freq: "3x/week", db: "External Rotation with Band",
        coaching: "Elbow at your side, forearm starts across your belly, rotate out against the band." },
      { name: "Band Pull-Apart", sets: 2, reps: "15", freq: "3x/week", db: "Band Pull Apart",
        coaching: "Arms straight at shoulder height, pull the band to your chest, squeeze shoulder blades together." },
      { name: "Face Pull", sets: 3, reps: "12–15", freq: "3x/week", db: "Face Pull",
        coaching: "Pull to your forehead and rotate your knuckles to the ceiling at the end — that rotation is the point." },
      { name: "Scaption (Full Can)", sets: 3, reps: "10–12", freq: "3x/week", db: "Dumbbell Scaption",
        coaching: "Thumbs up, raise about 30° in front of your body. Never do the thumbs-down (empty can) version under load." },
      { name: "Serratus Wall Slides", sets: 2, reps: "12", freq: "3x/week", db: null,
        coaching: "Forearms on the wall, slide up while \"punching\" the wall away — your shoulder blades should wrap around your ribs." },
      { name: "Prone Y / T / W Raises", sets: 3, reps: "10–12", freq: "3x/week", db: null,
        coaching: "Face down on a bench, light dumbbells or just arms. Y, then T, then W — no shrugging." }
    ],
    progression: {
      title: "Return-to-pressing ladder",
      body: "Reintroduce each step only when the previous is pain-free: push-up isometric holds → " +
        "bodyweight push-ups → neutral-grip DB floor press → neutral-grip decline DB press → " +
        "barbell board press (lower the boards gradually) → barbell floor press → neutral-grip DB bench → " +
        "close-grip bench → standard bench → incline → overhead press."
    },
    avoid: [
      "Behind-the-neck pressing and pulldowns",
      "Dips and upright rows",
      "Wide-grip bench with flared elbows",
      "Heavy lateral raises past 90°",
      "Empty-can (thumbs-down) exercises",
      "Sleeping on the painful shoulder",
      "Complete rest of the arm — it deconditions the cuff"
    ],
    redflags: [
      "Suddenly can't raise the arm after a trauma (possible full cuff tear)",
      "Real weakness — dropping objects",
      "Numbness or tingling into the hand",
      "Visible deformity or major swelling after injury",
      "Unrelenting night pain",
      "Fever with a red, hot joint",
      "No improvement after 6–12 weeks of consistent rehab"
    ],
    science: "The literature now says \"rotator cuff–related shoulder pain\" instead of \"impingement\" — " +
      "subacromial space size correlates poorly with pain, and surgical decompression doesn't beat " +
      "physiotherapy for most cases. Framework: Cressey's lifter-specific shoulder guide + Kibler scapular " +
      "rehabilitation guideline."
  },
  {
    id: "hips",
    name: "Hips",
    tagline: "Squat-depth mobility",
    icon: "flame",
    about: "Can't hit depth without your heels rising or knees caving? That's usually ankle " +
      "dorsiflexion and hip-flexion range — plus your own anatomy, which no drill overrides. " +
      "A wider stance with toes turned out lowers the hip demand. Never force depth through " +
      "groin or hip pain.",
    selftest: {
      title: "Knee-to-wall self-test",
      body: "Half-kneeling, heel glued down, drive your knee over your toes toward a wall. " +
        "About 5 inches (12.5 cm) from the wall is good. Under 3 inches — or a big side-to-side " +
        "difference — means the ankle needs work."
    },
    exercises: [
      { name: "Half-Kneeling Dorsiflexion Rocks", sets: 2, reps: "12/side", freq: "daily or pre-squat", db: null,
        coaching: "Heel stays glued down, drive the knee past your toes. This is the money drill for squat depth." },
      { name: "Goblet Squat Holds", sets: 3, reps: "30–60 sec", freq: "daily", db: "Goblet Squat",
        coaching: "Sink deep with a dumbbell or kettlebell at your chest and just hang out — bodyweight gives a natural end-range stretch." },
      { name: "90/90 Hip Rotations", sets: 2, reps: "8–10/side", freq: "3x/week", db: null,
        coaching: "Both knees at 90°, sit tall, rotate from one side to the other. Trains internal and external rotation." },
      { name: "Half-Kneeling Hip Flexor Stretch", sets: 2, reps: "30 sec/side", freq: "3x/week", db: "Kneeling Hip Flexor",
        coaching: "Tuck your tailbone, squeeze the glute on the kneeling side, shift forward until you feel the front of the hip." },
      { name: "Glute Bridge", sets: 2, reps: "15", freq: "3x/week", db: null,
        coaching: "Feet flat, drive through your heels, squeeze hard at the top. Wakes up sleepy glutes before you squat." },
      { name: "Calf Stretch — Straight + Bent Knee", sets: 3, reps: "20–30 sec each", freq: "3x/week", db: "Standing Soleus And Achilles Stretch",
        coaching: "Straight knee hits the gastrocnemius, bent knee hits the soleus. You need both for ankle range." }
    ],
    avoid: [
      "Forcing depth through groin or hip pain",
      "Aggressive bouncing at end range",
      "Ignoring persistent groin pain"
    ],
    redflags: [
      "Groin pain with clicking, catching, or locking (possible FAI / labral tear)",
      "Hip pain unresponsive to 4–6 weeks of mobility work",
      "Night pain or a new limp",
      "Pain after a trauma"
    ],
    science: "Ankle dorsiflexion and hip-flexion ROM track directly with squat depth (Kim et al. 2015; " +
      "Macrum et al. 2012). Dosage modeled on a 2026 6-week hip + ankle mobility RCT: 2–3 sets of 8–12 " +
      "controlled reps or 20–30 s holds, 3x/week, pain ≤3/10."
  },
  {
    id: "ankles",
    name: "Ankles",
    tagline: "Achilles + dorsiflexion",
    icon: "zap",
    about: "Achilles hates sudden spikes — new running, hills, or sprints piled on top of lifting. " +
      "The fix is progressive loading, not rest. Two flavors matter: midportion pain (2–6 cm above " +
      "the heel) vs insertional pain (right at the heel) — if it's insertional, skip heel drops off " +
      "a step edge (compression irritates it) and do them on flat ground.",
    exercises: [
      { name: "Slow Calf Raises", sets: 4, reps: "15 → 6", freq: "3x/week", db: "Standing Calf Raises",
        coaching: "3 seconds up, 3 seconds down. Start at a weight you can do 15 with, build toward heavy sets of 6 over weeks. " +
          "This is the Heavy Slow Resistance approach — same results as the classic eccentric program, easier to actually stick with." },
      { name: "Eccentric Heel Drops (Alfredson, simplified)", sets: 3, reps: "15 straight-knee + 15 bent-knee", freq: "daily", db: null,
        coaching: "Rise up on both feet, lower SLOW on the sore leg only. Some pain during is OK (up to 5/10) — work into it, not through agony. Add backpack weight in small steps once it's easy." },
      { name: "Isometric Calf Hold", sets: 5, reps: "45 sec", freq: "on painful days / pre-activity", db: null,
        coaching: "Hold a calf raise at ~70% effort. Good analgesic before activity when the tendon is grumpy." },
      { name: "Soleus Stretch", sets: 2, reps: "20–30 sec", freq: "3x/week", db: "Standing Soleus And Achilles Stretch",
        coaching: "Bent knee, heel down. Keep it gentle — don't crank an irritated insertional Achilles into a hard stretch." }
    ],
    avoid: [
      "Complete rest or immobilization",
      "Cortisone injections near the tendon (rupture risk)",
      "Heel drops off an edge for INSERTIONAL pain — flat ground only",
      "Sudden return to hills or speed work",
      "Fluoroquinolone antibiotics if an alternative exists (tendon risk)"
    ],
    redflags: [
      "Sudden pop or feeling \"kicked in the calf\" + can't do a single-leg heel raise (likely rupture — same-day care)",
      "A visible gap in the tendon",
      "Rapidly swelling, warm calf (possible clot, especially after immobilization)",
      "Severe pain unresponsive to 3–6 months of proper loading"
    ],
    science: "Alfredson 1998: 3×15 twice daily for 12 weeks got 15/15 athletes back to running. " +
      "Beyer 2015 RCT: Heavy Slow Resistance matched Alfredson at 12 and 52 weeks with 92% vs 78% " +
      "compliance. Pain rule from the JOSPT 2018 Achilles guideline (Silbernagel model): ≤5/10 during, " +
      "settled within 24 hours — complete rest is NOT indicated."
  },
  {
    id: "knees",
    name: "Knees",
    tagline: "Patellar tendinopathy",
    icon: "target",
    about: "\"Jumper's knee\" comes from energy-storage overload — more squats, lunges, and leg press, " +
      "deeper knee bend, sudden volume spikes. The tendon fails at the rate of load increase. " +
      "Rehab follows a simple ladder: calm it with isometrics → rebuild with slow strength → " +
      "reintroduce jumping only when strength and tolerance are back.",
    exercises: [
      { name: "Spanish Squat / Wall Sit Hold", sets: 5, reps: "45 sec", freq: "daily", db: null,
        coaching: "STAGE 1 — for irritable tendons (pain >5/10). Hold at ~70% effort, pain under 3/10. Isometrics calm the pain so you can load again." },
      { name: "Split Squat", sets: 3, reps: "10–15", freq: "3x/week", db: "Split Squats",
        coaching: "STAGE 2 — slow and controlled. Pain up to 3–5/10 is acceptable if it settles within 24 hours." },
      { name: "Step-Downs (Forward / Lateral)", sets: 3, reps: "10–15", freq: "3x/week", db: null,
        coaching: "STAGE 2 — slow lowering off a step, knee tracking over toes. The classic patellar-tendon builder." },
      { name: "Single-Leg Decline Squat", sets: 3, reps: "15", freq: "daily", db: null,
        coaching: "STAGE 2 — the gold standard: heel elevated on a ~25° decline board, slow single-leg squats. Give it ~3 months." },
      { name: "Heavy Slow Squat / Leg Press", sets: 4, reps: "15RM → 6RM", freq: "3x/week", db: null,
        coaching: "STAGE 2 alternative lifters prefer: squat, hack squat, or leg press, 3 seconds down + 3 seconds up. Same outcomes as eccentrics at 6 months, way better adherence." }
    ],
    progression: {
      title: "The 4-stage ladder (Malliaras model)",
      body: "Stage 1 — Isometrics (above) to calm pain. Stage 2 — Isotonics / Heavy Slow Resistance " +
        "(above) to rebuild capacity. Stage 3 — Energy storage: two-leg jumps, hops, split jumps, " +
        "deceleration and cutting — ONLY once strength and tolerance are rebuilt. Stage 4 — full return."
    },
    avoid: [
      "Complete rest — it weakens the tendon (relative rest, not immobilization)",
      "Jumping or playing through high pain",
      "Cortisone injections into the tendon",
      "NSAIDs used to mask pain while loading"
    ],
    redflags: [
      "Sudden pop with inability to straighten the knee (tendon rupture — emergency)",
      "Hot, swollen knee with locking, catching, or giving way",
      "Calf pain or swelling",
      "No response after 3–6 months of properly dosed loading"
    ],
    science: "Malliaras et al., JOSPT 2015: the 4-stage tendinopathy model (isometrics → isotonics → " +
      "energy storage → return). Kongsgaard RCT: Heavy Slow Resistance = equal outcomes to eccentric " +
      "decline squats with 70% vs 22% patient satisfaction. Pain monitoring: Silbernagel model."
  },
  {
    id: "prehab",
    name: "Prehab",
    tagline: "10–15 min injury insurance",
    icon: "medal",
    about: "Ten to fifteen minutes, 3–4x per week or as your pre-lift warm-up. Each block names " +
      "what it's protecting. Cheap insurance — the best rehab is the one you never need.",
    blocks: [
      { title: "Shoulders — protects the rotator cuff", items: [
        { name: "Band Pull-Apart", sets: 2, reps: "15", db: "Band Pull Apart" },
        { name: "Banded External Rotation", sets: 2, reps: "12–15/side", db: "External Rotation with Band" },
        { name: "Face Pull", sets: 2, reps: "12–15", db: "Face Pull" },
        { name: "Serratus Wall Slides", sets: 2, reps: "12", db: null },
        { name: "Thoracic Open Books", sets: 2, reps: "8/side", db: null }
      ]},
      { title: "Hips — protects squat depth, knees, hip irritation", items: [
        { name: "Glute Bridge", sets: 2, reps: "15", db: null },
        { name: "Banded Lateral Walk", sets: 2, reps: "12–15/side", db: null },
        { name: "90/90 Hip Rotations", sets: 2, reps: "8/side", db: null },
        { name: "Half-Kneeling Hip Flexor Stretch", sets: 2, reps: "30 sec/side", db: "Kneeling Hip Flexor" }
      ]},
      { title: "Ankles — protects Achilles/patellar capacity + depth", items: [
        { name: "Half-Kneeling Dorsiflexion Rocks", sets: 2, reps: "12/side", db: null },
        { name: "Calf Raises — Straight + Bent Knee", sets: 2, reps: "15 each", db: "Standing Calf Raises" }
      ]},
      { title: "Thoracic — protects overhead mechanics", items: [
        { name: "Foam-Roller Thoracic Extensions", sets: 2, reps: "10", db: null },
        { name: "Quadruped Thoracic Rotations", sets: 2, reps: "8/side", db: null }
      ]},
      { title: "Core — McGill Big 3, protects the low back", items: [
        { name: "McGill Curl-Up", sets: 1, reps: "6 × 10-sec holds", db: null },
        { name: "Side Plank", sets: 1, reps: "6 × 10-sec holds/side", db: null },
        { name: "Bird Dog", sets: 1, reps: "6 × 10-sec holds/side", db: null }
      ]},
      { title: "Grip — only if you do heavy grip work", items: [
        { name: "Light Wrist-Extensor Eccentrics", sets: 2, reps: "15", db: null },
        { name: "Wrist Extensor Stretch", sets: 2, reps: "30 sec/side", db: null }
      ]}
    ],
    avoid: [],
    redflags: [],
    science: "Synthesized from the cuff, hip, ankle, and tendon evidence above. McGill Big 3 dosage: " +
      "~10-second holds with continuous bracing, descending pyramid (6-4-2 → 8-6-4 → 10-8-6), " +
      "~20 s rest, daily or most days — endurance over intensity, never to failure. Note: no single " +
      "program beats the others for chronic low back pain — progressive lifting itself is evidence-based " +
      "rehab (JSAMS meta-analysis). The spine is robust; build capacity, not fear."
  }
];

function getRehabRoutine(id) {
  for (var i = 0; i < REHAB_ROUTINES.length; i++) {
    if (REHAB_ROUTINES[i].id === id) return REHAB_ROUTINES[i];
  }
  return null;
}
/* flatten a routine to loggable blocks (prehab uses grouped blocks) */
function rehabRoutineBlocks(r) {
  var out = [];
  if (r.exercises) {
    r.exercises.forEach(function (e) {
      out.push({ type: "rehab", exercise: e.name, db: e.db || null, sets: e.sets, reps: e.reps, coaching: e.coaching || "" });
    });
  }
  if (r.blocks) {
    r.blocks.forEach(function (b) {
      b.items.forEach(function (e) {
        out.push({ type: "rehab", exercise: e.name, db: e.db || null, sets: e.sets, reps: e.reps, group: b.title, coaching: "" });
      });
    });
  }
  return out;
}
