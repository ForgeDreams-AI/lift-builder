#!/usr/bin/env node
/* ============================================================
   tools/rebuild-plans.js — research-driven rebuild of the 48
   featured plans in plans.js.

   Run from the repo root:  node tools/rebuild-plans.js

   What it does (per Anthony's training research):
   1. Classifies each day's lift blocks as compound (main) or
      accessory (isolation).
   2. First compound of the day = headline lift → 3 working sets
      (bumped from 2 if needed; 4-set bodyweight blocks untouched).
   3. Warm-ups: headline compound → full warm-up; later compounds →
      one feeler set; accessories → none. Text is equipment-aware
      (barbell @60% / bodyweight easy / band light).
   4. Accessories at 3 sets → trimmed to 2 working sets.
   5. Circuit blocks get a warm-up note.
   6. PLAN_RULES rewritten with the research (warm-up, progression,
      effort, rest).

   It never touches: plan ids, titles, equipment, style, daysPerWeek,
   day names, exercise names/order, dbIds, or 4-set bodyweight blocks.
   ============================================================ */
'use strict';
var fs = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');
var PLANS_FILE = path.join(ROOT, 'plans.js');

/* ---------- classification ---------- */
var ISO_RE = /(curl|pushdown|pressdown|triceps extension|leg extension|leg curl|lateral raise|front raise|reverse fly|kickback|shrug|crunch|plank|dead bug|bird dog|back extension|hyperextension|face pull|calf|knee raise|glute bridge|lateral walk|side plank|pallof|mountain climber|hamstring walkout)/i;
var BW_RE = /(push-up|pull-up|chin-up|\bdips?\b|inverted row|pike push|scapular|step-up|split squat|single-leg|lunge)/i;

function isAccessory(name) { return ISO_RE.test(name); }
function isBodyweight(name) { return BW_RE.test(name); }

/* Warm-up prescription. Returns null when no warm-up applies. */
function warmupText(equipment, name, isHeadline) {
  var n = name.toLowerCase();
  if (/farmer carry/.test(n)) return null; // loaded finisher walk; no warm-up row
  if (/kettlebell swing/.test(n)) return isHeadline ? '2×10 light' : '1×10 light';
  if (isBodyweight(name) || equipment === 'Calisthenics / Bodyweight') {
    return isHeadline ? '1×8 easy' : '1×5 easy';
  }
  if (equipment === 'Resistance Bands') {
    return isHeadline ? '1×10 light band' : '1×8 light band';
  }
  return isHeadline ? '2×5 @ 60%' : '1×5 @ 60%';
}

/* ---------- load plans.js (var declarations, no DOM) ---------- */
var text = fs.readFileSync(PLANS_FILE, 'utf8');
/* indirect eval → global scope (strict-mode direct eval would hide the vars) */
(0, eval)(text + '\n;globalThis.__PLANS_REBUILD__ = { r: PLAN_RULES, f: FEATURED_PLANS };');
var FEATURED_PLANS = globalThis.__PLANS_REBUILD__.f;
delete globalThis.__PLANS_REBUILD__;
if (!Array.isArray(FEATURED_PLANS) || FEATURED_PLANS.length !== 48) {
  throw new Error('Expected 48 plans, found ' + (FEATURED_PLANS && FEATURED_PLANS.length));
}

/* ---------- transform ---------- */
var stats = {
  headlineWarmups: 0, feelerWarmups: 0, accessoriesTrimmed: 0,
  headlineBumped: 0, circuitNotes: 0, skippedFourSet: 0, skippedCarry: 0
};

FEATURED_PLANS.forEach(function (p) {
  p.days.forEach(function (d) {
    var seenCompound = false;
    d.blocks.forEach(function (b) {
      if (b.type === 'circuit') {
        b.warmupNote = 'Warm-up: 2 easy rounds of the circuit movements.';
        stats.circuitNotes++;
        return;
      }
      if (b.type !== 'lift') return;
      if (b.sets === 4) { stats.skippedFourSet++; return; } // bodyweight blocks: leave alone
      if (isAccessory(b.exercise)) {
        if (b.sets === 3) { b.sets = 2; stats.accessoriesTrimmed++; }
        return; // no warm-up on accessories
      }
      // compound lift
      if (!seenCompound) {
        seenCompound = true;
        if (b.sets < 3) { b.sets = 3; stats.headlineBumped++; }
        var w = warmupText(p.equipment, b.exercise, true);
        if (w) { b.warmup = w; stats.headlineWarmups++; }
        else stats.skippedCarry++;
      } else {
        var w2 = warmupText(p.equipment, b.exercise, false);
        if (w2) { b.warmup = w2; stats.feelerWarmups++; }
        else stats.skippedCarry++;
      }
    });
  });
});

/* ---------- PLAN_RULES ---------- */
var NEW_RULES = [
  'Warm up the day\u2019s first main lift: 2\u00d75 at 60% of your working weight (bodyweight: 1 easy set of 8; bands: 1 light set of 10). Later main lifts get one easy feeler set of 5. Accessories need no warm-up.',
  'Progression: hit the top of the rep range on every working set, then add 5 lb (upper body) or 10 lb (lower body) next session. On circuits: beat last week\u2019s rounds or reps, or shorten the rest.',
  'Effort: stop compounds when your form breaks (technical failure). Isolation work can be pushed closer to true failure.',
  'Rest 2\u20133 minutes on heavy compounds, 60\u201390 seconds on accessories, 60\u2013120 seconds between HIIT rounds.'
];

/* ---------- write back, preserving everything else byte-identical ---------- */
function replaceLiteral(src, varName, value) {
  var marker = 'var ' + varName + ' = ';
  var start = src.indexOf(marker);
  if (start < 0) throw new Error('Cannot find ' + marker);
  var i = start + marker.length;
  // bracket-match the array literal
  var depth = 0, inStr = false, strCh = '', esc = false;
  for (; i < src.length; i++) {
    var ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === strCh) inStr = false;
    } else if (ch === '"' || ch === "'") { inStr = true; strCh = ch; }
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  if (depth !== 0) throw new Error('Unbalanced brackets in ' + varName);
  // include the trailing semicolon if present
  var end = i;
  if (src[end] === ';') end++;
  return src.slice(0, start) + marker + JSON.stringify(value, null, 2) + ';' + src.slice(end);
}

var out = replaceLiteral(text, 'PLAN_RULES', NEW_RULES);
out = replaceLiteral(out, 'FEATURED_PLANS', FEATURED_PLANS);
fs.writeFileSync(PLANS_FILE, out);
console.log('Rebuilt 48 plans.');
console.log(JSON.stringify(stats, null, 2));
