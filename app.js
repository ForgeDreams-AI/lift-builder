/* ============================================================
   Lift Library — app logic (vanilla JS, no build step)
   Free product: everything lives in localStorage on this device.
   No accounts, no backend. Programs move between devices via
   shareable links (#p=<base64url program JSON>).
   Tabs: Home / Library / Programs / Log / Progress / History (+ Builder view).
   ============================================================ */
'use strict';

/* ---------------- inline SVG icons (no emoji anywhere) ---------------- */
var P = {
  dumbbell: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  playcircle: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none"/>',
  chart: '<path d="M5 20v-6M11 20V6M17 20v-9"/><path d="M3 20h18"/>',
  chevL: '<path d="M14.5 6L8.5 12l6 6"/>',
  chevR: '<path d="M9.5 6l6 6-6 6"/>',
  chevU: '<path d="M6 14.5l6-6 6 6"/>',
  chevD: '<path d="M6 9.5l6 6-6 6"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.5 2M9.5 2.5h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 13h9l1-13"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  pencil: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  zap: '<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/>',
  flame: '<path fill="currentColor" stroke="none" d="M12 2c1 4-3 5-3 9a5 5 0 0 0 10 .5C20.5 8 16 6 14 2c-3 2-5 5-5 8-1-1-1.5-2.5-1.5-4C5.7 7.6 5 10 5 12a7 7 0 0 0 14 0c0-4.5-4-7.5-7-10z"/>',
  medal: '<circle cx="12" cy="14" r="5"/><path d="M8.5 9.5L6 3h4l2 4 2-4h4l-2.5 6.5"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 3v4h-4"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'
};
function icon(n, s) {
  s = s || 24;
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>';
}

/* ---------------- helpers ---------------- */
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function uid() { return 'x' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function prettyDate(ds) {
  var p = String(ds).split('-'); if (p.length < 3) return String(ds);
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtElapsed(ms) {
  var s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function fmtDur(sec) {
  if (sec == null) return '—';
  var m = Math.round(sec / 60);
  if (m < 60) return m + ' min';
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
}
function num(x) { var n = parseFloat(x); return isNaN(n) ? null : n; }

/* ---------------- date helpers (local-time safe) ---------------- */
function parseYMD(ds) { var p = String(ds).split('-'); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1); }
function ymd(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function addDays(ds, n) { var d = parseYMD(ds); d.setDate(d.getDate() + n); return ymd(d); }
function diffDays(a, b) { return Math.round((parseYMD(b) - parseYMD(a)) / 86400000); }
function weekdayMon1(ds) { var w = parseYMD(ds).getDay(); return w === 0 ? 7 : w; }
function mondayOf(ds) { return addDays(ds, -(weekdayMon1(ds) - 1)); }
/* training weekdays (Mon=1..Sun=7) by days-per-week */
var TRAIN_WEEKDAYS = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5] };
var WD_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ---------------- rotating motivational quotes (one per day) ---------------- */
var QUOTES = [
  "Discipline is choosing what you want most over what you want now.",
  "The last three or four reps is what makes the muscle grow.",
  "Don't count the days. Make the days count.",
  "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
  "The body achieves what the mind believes.",
  "Success starts with self-discipline.",
  "You don't have to be extreme, just consistent.",
  "Train insane or remain the same.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Sweat is just fat crying.",
  "What seems impossible today will one day become your warm-up.",
  "A one-hour workout is 4% of your day. No excuses.",
  "The hardest lift of all is lifting your butt off the couch.",
  "Motivation is what gets you started. Habit is what keeps you going.",
  "Your only limit is you.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "If it doesn't challenge you, it won't change you.",
  "The difference between try and triumph is a little umph.",
  "Winners train. Losers complain.",
  "Be stronger than your excuses.",
  "One more rep. Always one more rep.",
  "Champions are made when no one is watching.",
  "Sore today, strong tomorrow.",
  "Don't wish for it. Work for it.",
  "The gym is my therapy.",
  "Progress, not perfection.",
  "Lift heavy, live happy.",
  "Your future self is watching you right now.",
  "Consistency compounds."
];
function quoteOfDay() {
  var d = todayStr().replace(/-/g, '');
  var h = 0;
  for (var i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) % 1000003;
  return QUOTES[h % QUOTES.length];
}

/* ============================================================
   Store — the app's data layer. Simple, synchronous, localStorage.
   This is the permanent storage decision: free product, on-device,
   no accounts, no backend. Programs move between devices via
   shareable links (see shareProgram / import view below).
   UI code must use Store methods — never touch localStorage directly.
   ============================================================ */
var Store = (function () {
  var KEY = 'liftBuilder.v1';
  var EXDB_KEY = 'liftBuilder.exdb.v1';

  function blank() { return { programs: [], logs: [], activePlan: null, measurements: [] }; }
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var p = JSON.parse(raw);
      if (!p || typeof p !== 'object') return blank();
      return {
        programs: Array.isArray(p.programs) ? p.programs : [],
        logs: Array.isArray(p.logs) ? p.logs : [],
        activePlan: (p.activePlan && typeof p.activePlan === 'object') ? p.activePlan : null,
        measurements: Array.isArray(p.measurements) ? p.measurements : []
      };
    } catch (e) { return blank(); }
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* quota/private mode */ }
  }
  function cleanEx(e) {
    e = e || {};
    return {
      dbId: String(e.dbId || ''),
      name: String(e.name || 'Exercise'),
      sets: Math.max(1, Math.min(20, parseInt(e.sets, 10) || 3)),
      reps: Math.max(1, Math.min(200, parseInt(e.reps, 10) || 10))
    };
  }
  function cleanProgram(p) {
    p = p || {};
    return {
      id: String(p.id || uid()),
      name: String(p.name || 'Untitled program').slice(0, 80),
      tagline: String(p.tagline || '').slice(0, 140),
      exercises: Array.isArray(p.exercises) ? p.exercises.map(cleanEx) : [],
      createdAt: p.createdAt || Date.now(),
      updatedAt: p.updatedAt || Date.now()
    };
  }

  return {
    /* ---- programs ---- */
    getPrograms: function () {
      return read().programs.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    },
    getProgram: function (id) {
      var ps = read().programs;
      for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i];
      return null;
    },
    saveProgram: function (p) {
      var s = read();
      var c = cleanProgram(p);
      c.updatedAt = Date.now();
      var found = false;
      for (var i = 0; i < s.programs.length; i++) {
        if (s.programs[i].id === c.id) { s.programs[i] = c; found = true; break; }
      }
      if (!found) { c.createdAt = Date.now(); s.programs.push(c); }
      write(s);
      return c;
    },
    deleteProgram: function (id) {
      var s = read();
      s.programs = s.programs.filter(function (p) { return p.id !== id; });
      write(s);
    },
    duplicateProgram: function (id, kind, featPlan) {
      var c;
      if (kind === 'featured' && featPlan) {
        /* flatten a featured plan's lift blocks into editable exercises, day-tagged */
        var exs = [];
        featPlan.days.forEach(function (day, di) {
          (day.blocks || []).forEach(function (b) {
            if (b.type === 'lift') {
              exs.push({ dbId: b.dbId || '', name: b.exercise, sets: b.sets, reps: b.reps, dayTag: 'Day ' + (di + 1) });
            }
          });
        });
        c = { id: uid(), name: (featPlan.title + ' (copy)').slice(0, 80), tagline: featPlan.equipment + ' · ' + featPlan.style, exercises: exs, createdAt: Date.now() };
        return this.saveProgram(c);
      }
      var p = this.getProgram(id);
      if (!p) return null;
      c = JSON.parse(JSON.stringify(p));
      c.id = uid();
      c.name = (p.name + ' (copy)').slice(0, 80);
      return this.saveProgram(c);
    },
    /* ---- logs ---- */
    getLogs: function () {
      return read().logs.slice().sort(function (a, b) {
        var d = String(b.date || '').localeCompare(String(a.date || ''));
        return d !== 0 ? d : (b.createdAt || 0) - (a.createdAt || 0);
      });
    },
    getLog: function (id) {
      var ls = read().logs;
      for (var i = 0; i < ls.length; i++) if (ls[i].id === id) return ls[i];
      return null;
    },
    saveLog: function (l) {
      var s = read();
      l = l || {};
      l.id = String(l.id || uid());
      l.createdAt = l.createdAt || Date.now();
      s.logs.push(l);
      write(s);
      return l;
    },
    updateLogRPE: function (id, rpe) {
      var s = read();
      for (var i = 0; i < s.logs.length; i++) {
        if (s.logs[i].id === id) {
          s.logs[i].rpe = rpe;
          if (s.logs[i].durationSec) s.logs[i].load = round1(rpe * (s.logs[i].durationSec / 60));
          break;
        }
      }
      write(s);
    },
    /* ---- body measurements ---- */
    getMeasurements: function () {
      return read().measurements.slice().sort(function (a, b) {
        return String(a.date).localeCompare(String(b.date));
      });
    },
    saveMeasurement: function (m) {
      var s = read();
      m = m || {};
      m.id = String(m.id || uid());
      m.createdAt = m.createdAt || Date.now();
      s.measurements.push(m);
      write(s);
      return m;
    },
    deleteMeasurement: function (id) {
      var s = read();
      s.measurements = s.measurements.filter(function (m) { return m.id !== id; });
      write(s);
    },
    deleteLog: function (id) {
      var s = read();
      s.logs = s.logs.filter(function (l) { return l.id !== id; });
      write(s);
    },
    /* ---- committed ("locked in") plan ---- */
    getActivePlan: function () { return read().activePlan; },
    setActivePlan: function (a) {
      var s = read();
      s.activePlan = {
        programId: String(a.programId || ''),
        kind: a.kind === 'featured' ? 'featured' : 'custom',
        startDate: String(a.startDate || ''),
        weeks: Math.max(1, Math.min(12, parseInt(a.weeks, 10) || 4))
      };
      write(s);
    },
    clearActivePlan: function () { var s = read(); s.activePlan = null; write(s); },
    /* ---- profile (name for the home greeting) ---- */
    getName: function () {
      try {
        var raw = localStorage.getItem('liftBuilder.profile.v1');
        if (raw) { var p = JSON.parse(raw); if (p && p.name) return String(p.name); }
      } catch (e) { /* ignore */ }
      return '';
    },
    setName: function (name) {
      try { localStorage.setItem('liftBuilder.profile.v1', JSON.stringify({ name: String(name || '').slice(0, 40) })); }
      catch (e) { /* ignore */ }
    },
    /* Most recent logged sets for an exercise (for prefill/coach). */
    lastExerciseSets: function (name) {
      var logs = this.getLogs();
      for (var i = 0; i < logs.length; i++) {
        var items = logs[i].items || [];
        var sets = [];
        for (var j = 0; j < items.length; j++) {
          if (String(items[j].exercise) === String(name)) sets.push(items[j]);
        }
        if (sets.length) return sets;
      }
      return null;
    },
    /* ---- exercise DB cache (separate key; ~1MB, never blocks the store) ---- */
    getExCache: function () {
      try {
        var raw = localStorage.getItem(EXDB_KEY);
        if (!raw) return null;
        var p = JSON.parse(raw);
        if (p && Array.isArray(p.data) && p.data.length > 100) return p;
      } catch (e) { /* fall through */ }
      return null;
    },
    setExCache: function (data) {
      try { localStorage.setItem(EXDB_KEY, JSON.stringify({ at: Date.now(), data: data })); }
      catch (e) { /* quota — app still works, just refetches next visit */ }
    }
  };
})();

/* ---------------- exercise DB (free-exercise-db, fetched at runtime) ---------------- */
var EXDB = {
  status: 'idle', // idle | loading | ready | error
  data: [],
  byId: {},
  load: function () {
    if (EXDB.status === 'loading' || EXDB.status === 'ready') return;
    EXDB.status = 'loading';
    render();
    var cached = Store.getExCache();
    if (cached) { EXDB.setData(cached.data); }
    fetch(LB_DB_URL, { cache: 'default' }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (d) {
      if (Array.isArray(d) && d.length > 100) {
        EXDB.setData(d);
        Store.setExCache(d);
      } else if (EXDB.status !== 'ready') {
        EXDB.status = 'error'; render();
      }
    }).catch(function () {
      if (EXDB.status !== 'ready') { EXDB.status = 'error'; render(); }
    });
  },
  setData: function (d) {
    EXDB.data = d;
    EXDB.byId = {};
    d.forEach(function (e) { if (e && e.id) EXDB.byId[e.id] = e; });
    EXDB.status = 'ready';
    render();
  },
  img: function (e, idx) {
    if (!e || !e.images || !e.images[idx]) return '';
    return LB_IMG_BASE + e.images[idx];
  },
  findByName: function (name) {
    var n = String(name).toLowerCase().trim();
    for (var i = 0; i < EXDB.data.length; i++) {
      if (String(EXDB.data[i].name).toLowerCase() === n) return EXDB.data[i];
    }
    return null;
  }
};
function exFor(ref) {
  if (!ref) return null;
  if (ref.dbId && EXDB.byId[ref.dbId]) return EXDB.byId[ref.dbId];
  return EXDB.findByName(ref.name || ref.exercise || '');
}

/* ---------------- toast ---------------- */
function toast(msg, kind) {
  var wrap = document.getElementById('toast-wrap');
  var t = el('div', 'toast animate-pop-in' + (kind === 'err' ? ' err' : ''), msg);
  wrap.appendChild(t);
  setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2200);
  setTimeout(function () { t.remove(); }, 2600);
}

/* ---------------- bottom sheet ---------------- */
function openSheet(html) {
  var root = document.getElementById('sheet-root');
  root.innerHTML =
    '<div class="scrim animate-fade-in" id="sheet-scrim"></div>' +
    '<div class="sheet animate-sheet-up" role="dialog" aria-modal="true"><div class="sheet-inner">' +
    '<div class="sheet-grab"></div>' +
    '<button class="sheet-x press" id="sheet-x" aria-label="Close">' + icon('x', 20) + '</button>' +
    html + '</div></div>';
  document.getElementById('sheet-scrim').onclick = closeSheet;
  document.getElementById('sheet-x').onclick = closeSheet;
}
function closeSheet() { document.getElementById('sheet-root').innerHTML = ''; }
function sheetOpen() { return !!document.getElementById('sheet-root').firstChild; }

/* ---------------- router ---------------- */
var TABS = [
  { id: 'home', label: 'Home', icon: 'flame' },
  { id: 'library', label: 'Library', icon: 'book' },
  { id: 'programs', label: 'Programs', icon: 'layers' },
  { id: 'log', label: 'Log', icon: 'play' },
  { id: 'progress', label: 'Progress', icon: 'trend' },
  { id: 'history', label: 'History', icon: 'chart' }
];
var state = {
  tab: 'home',
  onboarding: false,      // first-launch name prompt
  library: { view: 'cats', cat: null, q: '' },
  builder: null,          // {id, name, tagline, exercises[], picking:{cat,q}|null}
  builderReturn: 'programs',
  log: { view: 'pick', session: null },
  histOpen: null,         // open log id in history
  importing: null,        // shared program being imported (#p= link)
  planView: null,         // featured plan id being viewed
  rehabView: null,        // 'landing' or a rehab routine id
  featNav: { eq: null, style: null },   // featured drill-down: null,null=L1 · eq set=L2 · eq+style=L3
  progEx: null            // exercise selected for the projected-max trend
};

function go(tab) {
  stopLogTimer();
  state.tab = tab;
  if (tab === 'programs') { state.featNav = { eq: null, style: null }; state.planView = null; }
  if (tab === 'library' && state.library.view !== 'cats') { /* keep place */ }
  if (tab === 'log' && state.log.view === 'session') { /* keep session */ }
  render();
}
function renderTabbar() {
  var bar = document.getElementById('tabbar');
  bar.innerHTML = '';
  TABS.forEach(function (t) {
    var b = el('button', 'tab press' + (state.tab === t.id ? ' active' : ''));
    b.innerHTML = icon(t.icon, 25) + '<span>' + t.label + '</span><span class="dot"></span>';
    b.onclick = function () { go(t.id); };
    bar.appendChild(b);
  });
  document.getElementById('brand-icon').innerHTML = icon('dumbbell', 22);
}
function viewHead(kicker, title, sub, extra) {
  return '<div class="view-head"><div class="row"><div><span class="kicker">' + esc(kicker) + '</span>' +
    '<h2>' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' +
    '<div class="spacer"></div>' + (extra || '') + '</div></div>';
}
function backbar(label, fn) {
  return '<div class="backbar"><button class="back press" id="back-btn">' + icon('chevL', 20) + esc(label) + '</button></div>';
}
function emptyState(ico, title, sub, ctaLabel, ctaFn) {
  return '<div class="empty"><span class="eico">' + icon(ico, 30) + '</span>' +
    '<h3>' + esc(title) + '</h3><p>' + esc(sub) + '</p>' +
    (ctaLabel ? '<button class="btn press" id="empty-cta">' + esc(ctaLabel) + '</button>' : '') + '</div>';
}
function render() {
  renderTabbar();
  closeSheet();
  var root = document.getElementById('view-root');
  root.innerHTML = '';
  var v = el('div', 'view animate-fade-in');
  root.appendChild(v);
  if (state.onboarding) { renderOnboarding(v); return; }
  if (state.importing) { renderImport(v); return; }
  if (state.builder) { renderBuilder(v); return; }
  if (state.planView) { renderPlanDetail(v); return; }
  if (state.rehabView) { renderRehab(v); return; }
  if (state.tab === 'home') renderHome(v);
  else if (state.tab === 'library') renderLibrary(v);
  else if (state.tab === 'programs') renderPrograms(v);
  else if (state.tab === 'log') renderLog(v);
  else if (state.tab === 'progress') renderProgress(v);
  else if (state.tab === 'history') renderHistory(v);
  window.scrollTo(0, 0);
}

/* ============================================================
   LIBRARY — browse the 800+ exercise DB by category
   ============================================================ */
function libExercises() {
  var q = state.library.q.trim().toLowerCase();
  var list = EXDB.data;
  if (state.library.cat) list = list.filter(function (e) { return e.category === state.library.cat; });
  if (q) {
    list = list.filter(function (e) {
      var hay = (e.name + ' ' + (e.equipment || '') + ' ' + (e.primaryMuscles || []).join(' ') + ' ' + (e.secondaryMuscles || []).join(' ')).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }
  return list;
}
function renderLibrary(v) {
  v.innerHTML = viewHead('Exercise Library', 'Library', EXDB.status === 'ready' ? EXDB.data.length + ' exercises' : 'Loading exercises…') +
    '<div class="search-wrap">' + icon('search', 20) +
    '<input class="input" id="lib-q" type="search" placeholder="Search exercises, muscles, equipment…" value="' + esc(state.library.q) + '"></div>' +
    '<div id="lib-body"></div>';
  var q = document.getElementById('lib-q');
  q.addEventListener('input', function () {
    state.library.q = q.value;
    if (state.library.view === 'cats' && q.value.trim()) state.library.view = 'all';
    if (state.library.view === 'all' && !q.value.trim() && !state.library.cat) state.library.view = 'cats';
    renderLibBody();
  });
  renderLibBody();
}
function renderLibBody() {
  var body = document.getElementById('lib-body');
  if (!body) return;
  if (EXDB.status === 'loading' || EXDB.status === 'idle') {
    body.innerHTML = '<div class="cat-grid">' +
      '<div class="skel" style="height:132px"></div><div class="skel" style="height:132px"></div>' +
      '<div class="skel" style="height:132px"></div><div class="skel" style="height:132px"></div></div>';
    return;
  }
  if (EXDB.status === 'error') {
    body.innerHTML = '<div class="card"><h3>Couldn\'t load the exercise library</h3>' +
      '<p class="sec-sub">Check your connection and try again.</p>' +
      '<button class="btn block press" id="lib-retry">Retry</button></div>';
    document.getElementById('lib-retry').onclick = function () { EXDB.status = 'idle'; EXDB.load(); };
    return;
  }
  if (state.library.view === 'cats' && !state.library.q.trim()) {
    var counts = {};
    EXDB.data.forEach(function (e) { counts[e.category] = (counts[e.category] || 0) + 1; });
    var html = '<div class="cat-grid">';
    LB_CATEGORIES.forEach(function (c) {
      var n = counts[c.id] || 0;
      if (!n) return;
      html += '<button class="cat-box press" data-cat="' + esc(c.id) + '">' +
        '<span class="cat-ico">' + icon(c.icon, 24) + '</span>' +
        '<h3>' + esc(c.label) + '</h3>' +
        '<span class="n">' + n + ' exercises</span>' +
        '<p>' + esc(c.blurb) + '</p></button>';
    });
    // any categories not in our meta list
    Object.keys(counts).forEach(function (id) {
      var known = LB_CATEGORIES.some(function (c) { return c.id === id; });
      if (!known) {
        html += '<button class="cat-box press" data-cat="' + esc(id) + '">' +
          '<span class="cat-ico">' + icon('dumbbell', 24) + '</span>' +
          '<h3>' + esc(lbCatLabel(id)) + '</h3><span class="n">' + counts[id] + ' exercises</span></button>';
      }
    });
    html += '</div>';
    body.innerHTML = html;
    body.querySelectorAll('[data-cat]').forEach(function (b) {
      b.onclick = function () {
        state.library.view = 'list'; state.library.cat = b.getAttribute('data-cat');
        render();
        var qq = document.getElementById('lib-q'); if (qq) qq.focus();
      };
    });
    return;
  }
  // list view
  var list = libExercises();
  var title = state.library.cat ? lbCatLabel(state.library.cat) : 'All exercises';
  var html2 = backbar(state.library.cat ? 'Categories' : 'Library') +
    '<div class="sec-head">' + esc(title) + '<span class="n">' + list.length + '</span></div>';
  if (!list.length) {
    html2 += emptyState('search', 'No matches', 'Try a different search term.');
  } else {
    list.slice(0, 300).forEach(function (e) {
      html2 += '<button class="row-card press" data-ex="' + esc(e.id) + '">' +
        '<span class="row-ico">' + icon('dumbbell', 22) + '</span>' +
        '<span class="t"><b>' + esc(e.name) + '</b>' +
        '<small><span class="chip">' + esc(lbCatLabel(e.category)) + '</span>' +
        (e.equipment ? '<span class="chip">' + esc(e.equipment) + '</span>' : '') + '</small></span>' +
        '<span class="row-chev">' + icon('chevR', 20) + '</span></button>';
    });
    if (list.length > 300) html2 += '<p class="sec-sub">Showing first 300 — refine your search.</p>';
  }
  body.innerHTML = html2;
  var bb = document.getElementById('back-btn');
  if (bb) bb.onclick = function () { state.library.view = 'cats'; state.library.cat = null; render(); };
  body.querySelectorAll('[data-ex]').forEach(function (b) {
    b.onclick = function () { openExerciseSheet(b.getAttribute('data-ex')); };
  });
}

/* Exercise detail bottom sheet */
function openExerciseSheet(id, name) {
  var e = id ? EXDB.byId[id] : null;
  if (!e && name) e = EXDB.findByName(name);
  if (!e) {
    /* not in the DB — simple info sheet */
    openSheet('<h3>' + esc(name || 'Exercise') + '</h3>' +
      '<p class="sub">No demo available for this one yet — follow the plan\u2019s form cues and keep it controlled.</p>');
    return;
  }
  var imgs = '';
  for (var i = 0; i < 2; i++) {
    var u = EXDB.img(e, i);
    if (u) imgs += '<img src="' + esc(u) + '" alt="' + esc(e.name) + ' demo" loading="lazy" onerror="this.remove()">';
  }
  var muscles = (e.primaryMuscles || []).concat(e.secondaryMuscles || []).filter(function (m, i, a) { return a.indexOf(m) === i; });
  openSheet(
    '<h3>' + esc(e.name) + '</h3>' +
    '<p class="sub"><span class="chip">' + esc(lbCatLabel(e.category)) + '</span>' +
    (e.equipment ? ' <span class="chip">' + esc(e.equipment) + '</span>' : '') +
    (e.level ? ' <span class="chip">' + esc(e.level) + '</span>' : '') + '</p>' +
    (imgs ? '<div class="exd-imgs">' + imgs + '</div>' : '') +
    (muscles.length ? '<div class="exd-sec"><h4>Muscles worked</h4><div class="muscle-wrap">' +
      muscles.map(function (m) { return '<span class="chip">' + esc(m) + '</span>'; }).join('') + '</div></div>' : '') +
    (e.instructions && e.instructions.length ? '<div class="exd-sec"><h4>How to do it</h4><ol>' +
      e.instructions.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' : '') +
    (exVideo(e.name) ? '<div class="btn-row"><a class="btn block press" href="' + exVideo(e.name) + '" target="_blank" rel="noopener">' + icon('play', 18) + ' How-to video</a></div>' : '') +
    '<div class="btn-row"><button class="btn block press" id="ex-add">Add to program</button></div>'
  );
  document.getElementById('ex-add').onclick = function () { addToProgramSheet(e); };
}

/* "Add to program" — pick a target program or start a new one */
function addToProgramSheet(e) {
  var progs = Store.getPrograms();
  var html = '<h3>Add to program</h3><p class="sub">' + esc(e.name) + '</p>' +
    '<button class="opt-row press" id="atp-new"><span class="row-ico">' + icon('plus', 20) + '</span>' +
    '<span class="grow">New program<small>Start building with this exercise</small></span></button>';
  progs.forEach(function (p) {
    html += '<button class="opt-row press" data-pid="' + esc(p.id) + '"><span class="row-ico">' + icon('layers', 20) + '</span>' +
      '<span class="grow">' + esc(p.name) + '<small>' + p.exercises.length + ' exercises</small></span></button>';
  });
  openSheet(html);
  document.getElementById('atp-new').onclick = function () {
    openBuilder(null, { dbId: e.id, name: e.name, sets: 3, reps: 10 });
  };
  var root = document.getElementById('sheet-root');
  root.querySelectorAll('[data-pid]').forEach(function (b) {
    b.onclick = function () {
      var p = Store.getProgram(b.getAttribute('data-pid'));
      if (!p) return;
      p.exercises.push({ dbId: e.id, name: e.name, sets: 3, reps: 10 });
      Store.saveProgram(p);
      closeSheet();
      toast('Added to ' + p.name);
      render();
    };
  });
}

/* ============================================================
   PROGRAMS — "My Programs" library (starts empty by design)
   ============================================================ */
/* ---------- Featured programs: 3-level drill-down ---------- */
var FEAT_EQUIP = [
  { id: 'Commercial Gym', short: 'Commercial Gym', icon: 'dumbbell', blurb: 'Full gym access — barbells, machines, cables.' },
  { id: 'Calisthenics / Bodyweight', short: 'Calisthenics', icon: 'flame', blurb: 'Bodyweight only — needs a pull-up bar or rings.' },
  { id: 'Resistance Bands', short: 'Bands', icon: 'zap', blurb: 'Bands plus an anchor. Train anywhere.' },
  { id: 'Apartment / Hotel Gym', short: 'Hotel Gym', icon: 'target', blurb: 'Dumbbells, a bench, limited cardio.' }
];
var FEAT_STYLES = [
  { id: 'Traditional Strength Training', short: 'Traditional', icon: 'medal', blurb: 'Classic sets × reps. Get strong.' },
  { id: 'Strength + Cardio', short: 'Strength + Cardio', icon: 'trend', blurb: 'Lift, plus running, biking, or stairs.' },
  { id: 'HIIT / CrossFit-Inspired', short: 'HIIT / CrossFit', icon: 'timer', blurb: 'Circuits. Fast, hard, done.' }
];
var FEAT_DAYS = [2, 3, 4, 5];
function featEqShort(id) {
  for (var i = 0; i < FEAT_EQUIP.length; i++) if (FEAT_EQUIP[i].id === id) return FEAT_EQUIP[i].short;
  return id;
}
function featStyleShort(id) {
  for (var i = 0; i < FEAT_STYLES.length; i++) if (FEAT_STYLES[i].id === id) return FEAT_STYLES[i].short;
  return id;
}
function featPlansFor(eq, style) {
  return FEATURED_PLANS.filter(function (p) {
    return (!eq || p.equipment === eq) && (!style || p.style === style);
  });
}
function featCrumbHTML(nav) {
  var h = '<nav class="crumbs" aria-label="Breadcrumb">';
  h += '<button class="clink press" data-nav="l1">Programs</button>';
  if (nav.eq) {
    h += '<span class="csep">›</span>';
    if (nav.style) {
      h += '<button class="clink press" data-nav="l2">' + esc(featEqShort(nav.eq)) + '</button>' +
        '<span class="csep">›</span><span class="ccur">' + esc(featStyleShort(nav.style)) + '</span>';
    } else {
      h += '<span class="ccur">' + esc(featEqShort(nav.eq)) + '</span>';
    }
  }
  return h + '</nav>';
}
function wireFeatCrumbs(root) {
  root.querySelectorAll('[data-nav]').forEach(function (b) {
    b.onclick = function () {
      var t = b.getAttribute('data-nav');
      if (t === 'l1') state.featNav = { eq: null, style: null };
      else if (t === 'l2') state.featNav = { eq: state.featNav.eq, style: null };
      render();
    };
  });
}
function openPlanDetail(planId) { state.planView = planId; render(); }
function renderFeaturedPrograms(v) {
  var nav = state.featNav;
  var head = el('div');
  if (!nav.eq) {
    /* LEVEL 1 — gym type boxes */
    head.innerHTML = viewHead('Featured Programs', 'Programs',
      '48 coach-built plans. Pick your gear — three taps to your plan.') +
      '<div class="cat-grid" id="feat-l1"></div>';
    v.appendChild(head);
    var g1 = document.getElementById('feat-l1');
    FEAT_EQUIP.forEach(function (e) {
      var n = featPlansFor(e.id, null).length;
      var b = el('button', 'cat-box press');
      b.innerHTML = '<span class="cat-ico">' + icon(e.icon, 26) + '</span>' +
        '<h3>' + esc(e.id) + '</h3><span class="n">' + n + ' plans</span><p>' + esc(e.blurb) + '</p>';
      b.onclick = function () { state.featNav = { eq: e.id, style: null }; render(); };
      g1.appendChild(b);
    });
    return;
  }
  if (!nav.style) {
    /* LEVEL 2 — workout style boxes */
    head.innerHTML = backbar('Programs') + featCrumbHTML(nav) +
      viewHead('Workout style', featEqShort(nav.eq), 'How do you want to train?') +
      '<div class="cat-grid" id="feat-l2"></div>';
    v.appendChild(head);
    document.getElementById('back-btn').onclick = function () {
      state.featNav = { eq: null, style: null }; render();
    };
    wireFeatCrumbs(v);
    var g2 = document.getElementById('feat-l2');
    FEAT_STYLES.forEach(function (s) {
      var n = featPlansFor(nav.eq, s.id).length;
      var b = el('button', 'cat-box press');
      b.innerHTML = '<span class="cat-ico">' + icon(s.icon, 26) + '</span>' +
        '<h3>' + esc(s.id) + '</h3><span class="n">' + n + ' plans</span><p>' + esc(s.blurb) + '</p>';
      b.onclick = function () { state.featNav = { eq: nav.eq, style: s.id }; render(); };
      g2.appendChild(b);
    });
    return;
  }
  /* LEVEL 3 — days-per-week boxes */
  head.innerHTML = backbar(featEqShort(nav.eq)) + featCrumbHTML(nav) +
    viewHead('Days per week', featStyleShort(nav.style), 'How many days can you train?') +
    '<div class="cat-grid" id="feat-l3"></div>';
  v.appendChild(head);
  document.getElementById('back-btn').onclick = function () {
    state.featNav = { eq: nav.eq, style: null }; render();
  };
  wireFeatCrumbs(v);
  var g3 = document.getElementById('feat-l3');
  FEAT_DAYS.forEach(function (d) {
    var plans = featPlansFor(nav.eq, nav.style).filter(function (p) { return p.daysPerWeek === d; });
    var b = el('button', 'cat-box press');
    b.innerHTML = '<span class="daynum">' + d + '</span>' +
      '<h3>Days / week</h3><span class="n">' + (plans.length ? plans[0].days.length + ' training days' : '—') + '</span>';
    b.onclick = function () { if (plans.length) openPlanDetail(plans[0].id); };
    g3.appendChild(b);
  });
}
function renderMyPrograms(v) {
  var progs = Store.getPrograms();
  var head = el('div');
  head.innerHTML = viewHead('My Programs', 'Programs',
    progs.length ? progs.length + ' saved program' + (progs.length > 1 ? 's' : '') : 'Build it once, lift it forever.',
    '<button class="btn sm press" id="prog-new">' + icon('plus', 18) + ' New</button>') +
    '<div id="prog-list"></div>';
  v.appendChild(head);
  document.getElementById('prog-new').onclick = function () { openBuilder(null); };
  var list = document.getElementById('prog-list');
  if (!progs.length) {
    list.innerHTML = emptyState('layers', 'No programs yet',
      'Build your first program from 800+ exercises — name it, pick your lifts, set your schemes.',
      'Build a program');
    document.getElementById('empty-cta').onclick = function () { openBuilder(null); };
    return;
  }
  progs.forEach(function (p) {
    var d = el('div', 'prog-card');
    d.innerHTML =
      '<h3>' + esc(p.name) + '</h3>' +
      (p.tagline ? '<div class="tag">' + esc(p.tagline) + '</div>' : '') +
      '<div class="prog-meta"><span class="chip">' + p.exercises.length + ' exercises</span>' +
      '<span class="chip">' + p.exercises.reduce(function (a, e) { return a + (e.sets || 0); }, 0) + ' sets</span></div>' +
      '<div class="prog-actions">' +
      '<button class="btn press" data-act="start">' + icon('play', 18) + ' Start</button>' +
      '<button class="btn ghost iconbtn press" data-act="share" aria-label="Share program">' + icon('share', 20) + '</button>' +
      '<button class="btn ghost iconbtn press" data-act="edit" aria-label="Edit program">' + icon('pencil', 20) + '</button>' +
      '<button class="btn ghost iconbtn press" data-act="dup" aria-label="Duplicate program">' + icon('copy', 20) + '</button>' +
      '<button class="btn ghost iconbtn press" data-act="del" aria-label="Delete program">' + icon('trash', 20) + '</button>' +
      '</div>';
    d.querySelectorAll('[data-act]').forEach(function (b) {
      var act = b.getAttribute('data-act');
      b.onclick = function (ev) {
        ev.stopPropagation();
        if (act === 'start') openCommitSheet(p.id, 'custom');
        else if (act === 'edit') openBuilder(p.id);
        else if (act === 'share') shareProgram(p.id);
        else if (act === 'dup') { var c = Store.duplicateProgram(p.id); if (c) { toast('Duplicated'); render(); } }
        else if (act === 'del') confirmSheet('Delete "' + p.name + '"?', 'This can\'t be undone.', function () {
          Store.deleteProgram(p.id); render(); toast('Program deleted');
        });
      };
    });
    list.appendChild(d);
  });
}
function renderPrograms(v) {
  renderFeaturedPrograms(v);
  var div = el('div', 'sec-gap');
  v.appendChild(div);
  renderMyPrograms(v);
}
/* ---------- featured plan detail ---------- */
function renderPlanDetail(v) {
  var p = getFeaturedPlan(state.planView);
  if (!p) { state.planView = null; render(); return; }
  v.innerHTML = '<button class="backlink press" id="pd-back">\u2190 Back</button>' +
    '<div class="plan-hero"><span class="kicker">' + esc(p.equipment) + '</span><h2>' + esc(p.title) + '</h2>' +
    '<p class="sec-sub">' + p.daysPerWeek + ' days/week \u00b7 ' + esc(p.style) + '</p></div>';
  document.getElementById('pd-back').onclick = function () { state.planView = null; render(); };

  var rules = el('div', 'card rules');
  rules.innerHTML = '<div class="sec-head">How to run it</div><ul class="rules-list">' +
    PLAN_RULES.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>';
  v.appendChild(rules);

  p.days.forEach(function (day, di) {
    var dEl = el('details', 'day-detail');
    var sum = el('summary', 'day-sum');
    sum.innerHTML = '<span>' + esc(day.name) + '</span><span class="n">' + esc(blockSummary(day.blocks)) + '</span>';
    dEl.appendChild(sum);
    var body = el('div', 'day-blocks');
    day.blocks.forEach(function (b) {
      body.appendChild(renderPlanBlockRow(b));
    });
    var logBtn = el('div', 'btn-row');
    logBtn.innerHTML = '<button class="btn ghost block press" data-logday>Log this day</button>';
    logBtn.querySelector('[data-logday]').onclick = function () { startPlanDaySession(p.id, di); };
    body.appendChild(logBtn);
    dEl.appendChild(body);
    v.appendChild(dEl);
  });

  var cta = el('div', 'btn-row sticky-cta');
  cta.innerHTML = '<button class="btn primary block press" id="pd-commit">Start this plan</button>' +
    '<button class="btn ghost block press" id="pd-dup">Duplicate to My Programs</button>';
  v.appendChild(cta);
  document.getElementById('pd-commit').onclick = function () { openCommitSheet(p.id, 'featured'); };
  document.getElementById('pd-dup').onclick = function () {
    var copy = Store.duplicateProgram(null, 'featured', p);
    state.planView = null;
    openBuilder(copy.id);
    toast('Copied \u2014 edit it your way');
  };
}
function renderPlanBlockRow(b) {
  var row = el('div', 'plan-block');
  if (b.type === 'lift') {
    var vid = exVideo(b.exercise);
    row.innerHTML = '<span class="pb-ico">' + icon('dumbbell', 20) + '</span>' +
      '<div class="pb-body"><b>' + esc(b.exercise) + '</b>' +
      '<span class="n">' + b.sets + ' \u00d7 ' + esc(b.reps) + '</span>' +
      (vid ? ' <a class="vlink" href="' + vid + '" target="_blank" rel="noopener">How-to video</a>' : '') + '</div>';
    row.onclick = function () { openExerciseSheet(b.dbId, b.exercise); };
  } else if (b.type === 'circuit') {
    var lis = b.exercises.map(function (e) { return '<li>' + esc(e.exercise) + ' \u2014 ' + esc(e.reps) + '</li>'; }).join('');
    row.innerHTML = '<span class="pb-ico">' + icon('flame', 20) + '</span>' +
      '<div class="pb-body"><b>' + esc(b.title) + ' \u00d7 ' + b.rounds + ' rounds</b><ul class="pb-list">' + lis + '</ul></div>';
  } else {
    row.innerHTML = '<span class="pb-ico">' + icon('play', 20) + '</span>' +
      '<div class="pb-body"><b>Cardio</b><span>' + esc(b.text) + '</span></div>';
  }
  return row;
}
/* ---------- commit ("lock in") flow ---------- */
function openCommitSheet(programId, kind) {
  var feat = kind === 'featured' ? getFeaturedPlan(programId) : null;
  var name = feat ? feat.title : Store.getProgram(programId).name;
  var weeks = 4;
  var wbtns = '';
  for (var w = 1; w <= 12; w++) wbtns += '<button class="wbtn press' + (w === weeks ? ' on' : '') + '" data-w="' + w + '">' + w + '</button>';
  openSheet('<h3>Lock it in</h3>' +
    '<p class="sec-sub">\u201c' + esc(name) + '\u201d \u2014 how many weeks?</p>' +
    '<div class="weekpick">' + wbtns + '</div>' +
    '<div class="btn-row"><button class="btn primary block press" id="cm-go">Start plan</button></div>');
  var btns = document.getElementById('sheet-root').querySelectorAll('.wbtn');
  Array.prototype.forEach.call(btns, function (b) {
    b.onclick = function () {
      weeks = +b.dataset.w;
      Array.prototype.forEach.call(btns, function (x) { x.classList.toggle('on', x === b); });
    };
  });
  document.getElementById('cm-go').onclick = function () {
    Store.setActivePlan({ programId: programId, kind: kind, startDate: todayStr(), weeks: weeks });
    closeSheet(); state.planView = null; state.tab = 'home'; render();
    toast(weeks + '-week plan locked in. Let\u2019s go.');
  };
}

/* Shareable program links: #p=<base64url(program JSON)>. Zero backend. */
function b64urlEncode(s) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return decodeURIComponent(escape(atob(s)));
}
function programShareUrl(p) {
  var clean = { name: p.name, tagline: p.tagline, exercises: p.exercises.map(function (e) {
    return { dbId: e.dbId, name: e.name, sets: e.sets, reps: e.reps };
  }) };
  return location.origin + location.pathname + '#p=' + b64urlEncode(JSON.stringify(clean));
}
function shareProgram(id) {
  var p = Store.getProgram(id);
  if (!p) return;
  var url = programShareUrl(p);
  if (navigator.share) {
    navigator.share({ title: p.name + ' — Lift Library', text: 'Check out this lifting program:', url: url })
      .catch(function () { /* user dismissed */ });
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function () { toast('Share link copied'); },
      function () { toast('Copy failed', 'err'); });
  } else {
    openSheet('<h3>Share program</h3><p class="sub">Copy this link:</p>' +
      '<div class="card" style="word-break:break-all;font-size:13px">' + esc(url) + '</div>');
  }
}
/* Opening a #p= link: preview + "Add to my library". */
function checkImportHash() {
  var h = location.hash || '';
  if (h.indexOf('#p=') !== 0) return false;
  try {
    var p = JSON.parse(b64urlDecode(h.slice(3)));
    if (!p || !p.name || !Array.isArray(p.exercises) || !p.exercises.length) throw new Error('bad');
    state.importing = {
      name: String(p.name).slice(0, 80),
      tagline: String(p.tagline || '').slice(0, 140),
      exercises: p.exercises.map(function (e) {
        return { dbId: String(e.dbId || ''), name: String(e.name || 'Exercise'), sets: Math.max(1, parseInt(e.sets, 10) || 3), reps: Math.max(1, parseInt(e.reps, 10) || 10) };
      })
    };
    return true;
  } catch (e) {
    history.replaceState(null, '', location.pathname);
    toast('That share link was invalid', 'err');
    return false;
  }
}
function renderImport(v) {
  var p = state.importing;
  var html = viewHead('Shared program', esc(p.name), p.tagline || 'Someone shared this program with you.') +
    '<div class="card"><h3 style="margin-bottom:8px">Exercises</h3>';
  p.exercises.forEach(function (e, i) {
    html += '<div class="hist-detail"><div class="ex-h" style="margin-top:' + (i ? '10px' : '2px') + '">' +
      '<span style="color:var(--th-primary);font-family:\'Barlow Condensed\',sans-serif;margin-right:8px">' + ('0' + (i + 1)).slice(-2) + '</span>' +
      esc(e.name) + '</div><div class="set-line"><span>Scheme</span><b>' + e.sets + ' × ' + e.reps + '</b></div></div>';
  });
  html += '</div><div class="btn-row"><button class="btn block press" id="imp-add">' + icon('plus', 18) + ' Add to my library</button></div>' +
    '<div class="btn-row"><button class="btn ghost block press" id="imp-dismiss">Dismiss</button></div>';
  v.innerHTML = html;
  document.getElementById('imp-add').onclick = function () {
    var saved = Store.saveProgram({ name: p.name, tagline: p.tagline, exercises: p.exercises });
    state.importing = null;
    history.replaceState(null, '', location.pathname);
    state.tab = 'programs';
    render();
    toast('"' + saved.name + '" added to your library');
  };
  document.getElementById('imp-dismiss').onclick = function () {
    state.importing = null;
    history.replaceState(null, '', location.pathname);
    render();
  };
}

function confirmSheet(title, sub, onYes) {
  openSheet('<h3>' + esc(title) + '</h3><p class="sub">' + esc(sub) + '</p>' +
    '<div class="btn-row"><button class="btn danger-line press" id="cf-no">Cancel</button>' +
    '<button class="btn press" id="cf-yes">Delete</button></div>');
  document.getElementById('cf-no').onclick = closeSheet;
  document.getElementById('cf-yes').onclick = function () { closeSheet(); onYes(); };
}

/* ============================================================
   BUILDER — create / edit a program
   ============================================================ */
function openBuilder(programId, preAdd) {
  var p = programId ? Store.getProgram(programId) : null;
  state.builder = {
    id: p ? p.id : null,
    name: p ? p.name : '',
    tagline: p ? p.tagline : '',
    exercises: p ? JSON.parse(JSON.stringify(p.exercises)) : [],
    picking: null
  };
  state.builderReturn = state.tab;
  if (preAdd) state.builder.exercises.push({ dbId: preAdd.dbId || '', name: preAdd.name, sets: preAdd.sets || 3, reps: preAdd.reps || 10 });
  render();
}
function renderBuilder(v) {
  var b = state.builder;
  if (b.picking) { renderPicker(v); return; }
  var html = backbar('Programs') +
    viewHead('Program Builder', b.id ? 'Edit program' : 'New program', 'Name it, pick your lifts, set your schemes.') +
    '<label class="field"><span>Program name</span>' +
    '<input class="input" id="b-name" maxlength="80" placeholder="e.g. Heavy Upper Body" value="' + esc(b.name) + '"></label>' +
    '<label class="field"><span>Tagline (optional)</span>' +
    '<input class="input" id="b-tag" maxlength="140" placeholder="e.g. Push day — chest, shoulders, tris" value="' + esc(b.tagline) + '"></label>' +
    '<div class="sec-head">Exercises<span class="n">' + b.exercises.length + '</span></div>' +
    '<div id="b-list"></div>' +
    '<button class="btn ghost block press" id="b-add" style="margin-bottom:12px">' + icon('plus', 18) + ' Add exercises</button>' +
    '<div class="btn-row"><button class="btn ghost press" id="b-cancel">Cancel</button>' +
    '<button class="btn press" id="b-save">Save program</button></div>';
  v.innerHTML = html;
  document.getElementById('back-btn').onclick = function () { state.builder = null; render(); };
  document.getElementById('b-cancel').onclick = function () { state.builder = null; render(); };
  document.getElementById('b-add').onclick = function () { b.picking = { cat: null, q: '' }; render(); };
  document.getElementById('b-save').onclick = saveBuilder;
  renderBuilderList();
}
function renderBuilderList() {
  var b = state.builder;
  var list = document.getElementById('b-list');
  if (!list) return;
  list.innerHTML = '';
  if (!b.exercises.length) {
    list.innerHTML = '<div class="card"><p class="sec-sub" style="margin:0">No exercises yet — tap "Add exercises" to pick from 800+.</p></div>';
    return;
  }
  b.exercises.forEach(function (e, i) {
    var d = el('div', 'bex');
    d.innerHTML =
      '<div class="bex-top"><span class="bex-num">' + ('0' + (i + 1)).slice(-2) + '</span>' +
      '<span class="bex-name">' + esc(e.name) + '</span>' +
      '<span class="bex-tools">' +
      '<button class="tool press" data-t="up" aria-label="Move up"' + (i === 0 ? ' disabled style="opacity:.3"' : '') + '>' + icon('chevU', 20) + '</button>' +
      '<button class="tool press" data-t="down" aria-label="Move down"' + (i === b.exercises.length - 1 ? ' disabled style="opacity:.3"' : '') + '>' + icon('chevD', 20) + '</button>' +
      '<button class="tool danger press" data-t="rm" aria-label="Remove">' + icon('trash', 20) + '</button>' +
      '</span></div>' +
      '<div class="stepper"><span class="lab">Sets</span>' +
      '<button data-s="sets" data-d="-1" aria-label="Fewer sets">−</button>' +
      '<span class="val tabular">' + e.sets + '</span>' +
      '<button data-s="sets" data-d="1" aria-label="More sets">+</button>' +
      '<span class="lab" style="margin-left:12px">Reps</span>' +
      '<button data-s="reps" data-d="-1" aria-label="Fewer reps">−</button>' +
      '<span class="val tabular">' + e.reps + '</span>' +
      '<button data-s="reps" data-d="1" aria-label="More reps">+</button></div>';
    d.querySelectorAll('[data-t]').forEach(function (btn) {
      btn.onclick = function () {
        var t = btn.getAttribute('data-t');
        if (t === 'rm') { b.exercises.splice(i, 1); }
        else if (t === 'up' && i > 0) { var tmp = b.exercises[i - 1]; b.exercises[i - 1] = b.exercises[i]; b.exercises[i] = tmp; }
        else if (t === 'down' && i < b.exercises.length - 1) { var tmp2 = b.exercises[i + 1]; b.exercises[i + 1] = b.exercises[i]; b.exercises[i] = tmp2; }
        renderBuilderList();
      };
    });
    d.querySelectorAll('[data-s]').forEach(function (btn) {
      btn.onclick = function () {
        var k = btn.getAttribute('data-s'), dd = parseInt(btn.getAttribute('data-d'), 10);
        if (k === 'sets') e.sets = Math.max(1, Math.min(20, e.sets + dd));
        else e.reps = Math.max(1, Math.min(200, e.reps + dd));
        renderBuilderList();
      };
    });
    list.appendChild(d);
  });
}
/* Exercise picker inside the builder */
function renderPicker(v) {
  var b = state.builder, pk = b.picking;
  var q = pk.q.trim().toLowerCase();
  var list = EXDB.data.filter(function (e) {
    if (pk.cat && e.category !== pk.cat) return false;
    if (!q) return true;
    var hay = (e.name + ' ' + (e.equipment || '') + ' ' + (e.primaryMuscles || []).join(' ')).toLowerCase();
    return hay.indexOf(q) >= 0;
  });
  var html = backbar('Back to builder') +
    viewHead('Add exercises', pk.cat ? lbCatLabel(pk.cat) : 'Pick a category',
      'Tap + to add. Add as many as you want, then Done.') +
    '<div class="search-wrap">' + icon('search', 20) +
    '<input class="input" id="pk-q" type="search" placeholder="Search…" value="' + esc(pk.q) + '"></div>' +
    '<div id="pk-body"></div>' +
    '<div class="btn-row" style="position:sticky;bottom:0;padding:10px 0;background:var(--th-bg)">' +
    '<button class="btn block press" id="pk-done">Done (' + b.exercises.length + ' in program)</button></div>';
  v.innerHTML = html;
  document.getElementById('back-btn').onclick = function () { b.picking = null; render(); };
  document.getElementById('pk-done').onclick = function () { b.picking = null; render(); };
  var qi = document.getElementById('pk-q');
  qi.addEventListener('input', function () { pk.q = qi.value; paintPk(); });
  function paintPk() {
    var body = document.getElementById('pk-body');
    var qq = pk.q.trim().toLowerCase();
    var lst = EXDB.data.filter(function (e) {
      if (pk.cat && e.category !== pk.cat) return false;
      if (!qq) return true;
      var hay = (e.name + ' ' + (e.equipment || '') + ' ' + (e.primaryMuscles || []).join(' ')).toLowerCase();
      return hay.indexOf(qq) >= 0;
    });
    var h = '';
    if (!pk.cat && !qq) {
      var counts = {};
      EXDB.data.forEach(function (e) { counts[e.category] = (counts[e.category] || 0) + 1; });
      h += '<div class="cat-grid" style="margin-bottom:14px">';
      LB_CATEGORIES.forEach(function (c) {
        if (!counts[c.id]) return;
        h += '<button class="cat-box press" data-pcat="' + esc(c.id) + '"><span class="cat-ico">' + icon(c.icon, 24) + '</span>' +
          '<h3>' + esc(c.label) + '</h3><span class="n">' + counts[c.id] + ' exercises</span></button>';
      });
      h += '</div>';
    }
    var rows = lst.slice(0, 200);
    rows.forEach(function (e) {
      var added = b.exercises.some(function (x) { return x.dbId === e.id; });
      h += '<div class="row-card"><span class="t"><b>' + esc(e.name) + '</b>' +
        '<small>' + esc(lbCatLabel(e.category)) + (e.equipment ? ' · ' + esc(e.equipment) : '') + '</small></span>' +
        '<button class="btn sm press" data-addex="' + esc(e.id) + '"' + (added ? ' disabled' : '') + '>' +
        (added ? icon('check', 18) : icon('plus', 18)) + '</button></div>';
    });
    if (lst.length > 200) h += '<p class="sec-sub">Showing first 200 — refine your search.</p>';
    if (!lst.length && (pk.cat || qq)) h += emptyState('search', 'No matches', 'Try a different search.');
    body.innerHTML = h;
    body.querySelectorAll('[data-pcat]').forEach(function (x) {
      x.onclick = function () { pk.cat = x.getAttribute('data-pcat'); render(); };
    });
    body.querySelectorAll('[data-addex]').forEach(function (btn) {
      btn.onclick = function () {
        var e = EXDB.byId[btn.getAttribute('data-addex')];
        if (!e) return;
        b.exercises.push({ dbId: e.id, name: e.name, sets: 3, reps: 10 });
        document.getElementById('pk-done').textContent = 'Done (' + b.exercises.length + ' in program)';
        btn.disabled = true;
        btn.innerHTML = icon('check', 18);
        toast(e.name + ' added');
      };
    });
  }
  paintPk();
}
function saveBuilder() {
  var b = state.builder;
  b.name = document.getElementById('b-name').value.trim();
  b.tagline = document.getElementById('b-tag').value.trim();
  if (!b.name) { toast('Give your program a name', 'err'); document.getElementById('b-name').focus(); return; }
  if (!b.exercises.length) { toast('Add at least one exercise', 'err'); return; }
  var saved = Store.saveProgram({ id: b.id, name: b.name, tagline: b.tagline, exercises: b.exercises });
  state.builder = null;
  state.tab = 'programs';
  render();
  toast('"' + saved.name + '" saved');
}

/* ============================================================
   LOG — pick a program, log it set by set
   ============================================================ */
var logStartTime = null, logTimerId = null;

function stopLogTimer() {
  if (logTimerId !== null) { clearInterval(logTimerId); logTimerId = null; }
  logStartTime = null;
}
function renderLog(v) {
  if (state.log.view === 'session' && state.log.session) { renderLogSession(v); return; }
  var progs = Store.getPrograms();
  v.innerHTML = viewHead('Log workout', 'Log', 'Pick a program and get after it.') + '<div id="log-pick"></div>';
  var pick = document.getElementById('log-pick');
  var fb = el('button', 'row-card press');
  fb.innerHTML = '<span class="row-ico">' + icon('star', 22) + '</span>' +
    '<span class="t"><b>Featured plan day</b><small>Log a single day from any of the 48 featured plans</small></span>' +
    '<span class="row-chev">' + icon('chevR', 20) + '</span>';
  fb.onclick = function () { state.tab = 'programs'; render(); };
  pick.appendChild(fb);
  if (!progs.length) {
    var es = el('div');
    es.innerHTML = emptyState('play', 'No programs to log',
      'Build a program first, then log your workouts against it.');
    pick.appendChild(es);
    return;
  }
  progs.forEach(function (p) {
    var b = el('button', 'row-card press');
    b.innerHTML = '<span class="row-ico">' + icon('play', 22) + '</span>' +
      '<span class="t"><b>' + esc(p.name) + '</b>' +
      '<small>' + p.exercises.length + ' exercises</small></span>' +
      '<span class="row-chev">' + icon('chevR', 20) + '</span>';
    b.onclick = function () { startLogSession(p.id); };
    pick.appendChild(b);
  });
}
/* custom program -> lift blocks */
function startLogSession(programId) {
  var p = Store.getProgram(programId);
  if (!p || !p.exercises.length) { toast('That program has no exercises', 'err'); return; }
  stopLogTimer();
  state.log.view = 'session';
  state.log.session = {
    programId: p.id,
    programName: p.name,
    planKind: 'custom',
    date: todayStr(),
    blocks: p.exercises.map(function (e) {
      return { type: 'lift', exercise: e.name, dbId: e.dbId || '', sets: e.sets, reps: e.reps, dayTag: e.dayTag || '' };
    }),
    note: ''
  };
  state.tab = 'log';
  render();
}
/* featured plan day -> mixed blocks */
function startPlanDaySession(planId, dayIdx) {
  var p = getFeaturedPlan(planId);
  if (!p || !p.days[dayIdx]) { toast('Plan day not found', 'err'); return; }
  stopLogTimer();
  state.log.view = 'session';
  state.log.session = {
    programId: planId,
    programName: p.title + ' — ' + p.days[dayIdx].name,
    planKind: 'featured',
    date: todayStr(),
    blocks: JSON.parse(JSON.stringify(p.days[dayIdx].blocks)),
    note: ''
  };
  state.tab = 'log';
  render();
}
function setRowHTML(i, s, w, r) {
  return '<div class="set-row" data-ex="' + i + '" data-set="' + s + '">' +
    '<span class="set-badge">' + s + '</span>' +
    '<label class="set-input"><input type="number" inputmode="decimal" min="0" step="0.5" data-w value="' + esc(w) + '" placeholder="–"><span class="unit">lb</span></label>' +
    '<label class="set-input"><input type="number" inputmode="numeric" min="0" step="1" data-r value="' + esc(r) + '" placeholder="–"><span class="unit">reps</span></label>' +
    '</div>';
}
function updateSetCount() {
  var rows = document.querySelectorAll('#log-body .set-row');
  var done = 0;
  rows.forEach(function (sr) {
    if (sr.querySelector('input[data-w]').value !== '' || sr.querySelector('input[data-r]').value !== '') done++;
  });
  var d = document.getElementById('sets-done'), t = document.getElementById('sets-total');
  if (d) d.textContent = done;
  if (t) t.textContent = '/' + rows.length;
}
function coachFor(name) {
  var sess = Store.lastExerciseSets(name);
  if (!sess || !sess.length) return { line: '', weight: '', reps: '', e1rm: null };
  var topW = null, topReps = '', wCount = 0, repSum = 0, repN = 0;
  sess.forEach(function (s) {
    var wt = num(s.weight), rp = num(s.reps);
    if (wt !== null) { wCount++; if (topW === null || wt > topW) { topW = wt; topReps = s.reps == null ? '' : String(s.reps); } }
    if (rp !== null) { repSum += rp; repN++; }
  });
  if (topW === null) return { line: '', weight: '', reps: '', e1rm: null };
  var best = bestSetE1RM(sess);
  var e1rm = best ? best.e1rm : null;
  var avg = repN ? repSum / repN : null;
  var line = 'Last time: ' + topW + ' lb × ' + sess.map(function (s) { return s.reps === '' || s.reps == null ? '–' : s.reps; }).join(', ');
  var n = name.toLowerCase();
  var isLeg = /leg|squat|lunge|deadlift|\brdl\b|calf|glute|hamstring|quad/.test(n);
  if (wCount >= 2 && avg !== null && avg >= 8) {
    var target = Math.round((topW + (isLeg ? 10 : 5)) * 10) / 10;
    return { line: line + ' — crushed it. Try ' + target + ' lb today.', weight: String(target), reps: topReps, e1rm: e1rm };
  }
  return { line: line, weight: String(topW), reps: topReps, e1rm: e1rm };
}
function liftBlockEl(b, i) {
  var coach = coachFor(b.exercise);
  var blk = el('div', 'ex-block lift-block');
  blk.setAttribute('data-block', i);
  var setsHTML = '';
  for (var k = 1; k <= (b.sets || 3); k++) {
    setsHTML += setRowHTML(i, k, k === 1 ? coach.weight : '', k === 1 ? coach.reps : '');
  }
  var db = exFor(b);
  var dayChip = b.dayTag ? '<span class="chip">' + esc(b.dayTag) + '</span>' : '';
  blk.innerHTML =
    '<div class="ex-head-row"><span class="ex-num">' + ('0' + (i + 1)).slice(-2) + '</span>' +
    '<div class="ex-title-wrap"><div class="ex-name">' + dayChip + ' ' + esc(b.exercise) + '</div>' +
    '<div class="ex-scheme">' + (b.sets || 3) + ' × ' + esc(String(b.reps)) + (db ? ' · ' + esc(lbCatLabel(db.category)) : '') + '</div>' +
    '<button type="button" class="tool press" data-help="' + i + '" style="width:auto;height:auto;padding:6px 0;color:var(--th-primary);font-weight:600;font-size:14px">How to do it</button>' +
    (coach.line ? '<div class="coach-line">' + esc(coach.line) + '</div>' : '') +
    (coach.e1rm ? '<div class="projmax-line">Projected max: <b>' + Math.round(coach.e1rm) + ' lb</b></div>' : '') +
    '</div></div>' +
    '<div class="sets-head"><span>SET</span><span>WEIGHT</span><span>REPS</span></div>' +
    '<div class="sets" data-sets="' + i + '">' + setsHTML + '</div>' +
    '<button type="button" class="btn ghost sm press add-set" data-add="' + i + '">+ Add set</button>';
  return blk;
}
function circuitBlockEl(b, i) {
  var blk = el('div', 'ex-block circuit-block');
  blk.setAttribute('data-block', i);
  var h = '<div class="ex-head-row"><span class="ex-num">C' + (i + 1) + '</span>' +
    '<div class="ex-title-wrap"><div class="ex-name">' + esc(b.title || 'Circuit') + '</div>' +
    '<div class="ex-scheme">' + b.rounds + ' rounds · 60\u2013120s rest between rounds</div></div></div>';
  for (var r = 1; r <= b.rounds; r++) {
    h += '<div class="round" data-round="' + r + '"><div class="round-head"><span>Round ' + r + '</span>' +
      '<button type="button" class="btn ghost sm press round-done" data-rdone>Mark done</button></div>';
    b.exercises.forEach(function (e) {
      h += '<div class="set-row" data-exname="' + esc(e.exercise) + '">' +
        '<span class="set-name">' + esc(e.exercise) + '</span>' +
        '<label class="set-input"><input type="number" inputmode="numeric" min="0" step="1" data-cr value="' + esc(String(e.reps)) + '" placeholder="\u2013"><span class="unit">reps</span></label>' +
        '</div>';
    });
    h += '</div>';
  }
  blk.innerHTML = h;
  return blk;
}
function cardioBlockEl(b, i) {
  var blk = el('div', 'ex-block cardio-block');
  blk.setAttribute('data-block', i);
  blk.innerHTML = '<div class="ex-head-row"><span class="ex-num">\u2665</span>' +
    '<div class="ex-title-wrap"><div class="ex-name">Cardio</div></div></div>' +
    '<p class="cardio-text">' + esc(b.text) + '</p>' +
    '<button type="button" class="btn ghost block press" data-cdone>Mark complete</button>';
  return blk;
}
function rehabBlockEl(b, i) {
  var blk = el('div', 'ex-block rehab-block');
  blk.setAttribute('data-block', i);
  var nSets = num(b.sets) || 2;
  var h = '<div class="ex-head-row"><span class="ex-num">R' + (i + 1) + '</span>' +
    '<div class="ex-title-wrap"><div class="ex-name"><span class="chip rehab-chip">Rehab</span> ' + esc(b.exercise) + '</div>' +
    '<div class="ex-scheme">' + b.sets + ' \u00d7 ' + esc(String(b.reps)) + '</div>' +
    (b.group ? '<div class="n">' + esc(b.group) + '</div>' : '') +
    (b.coaching ? '<div class="coach-line">' + esc(b.coaching) + '</div>' : '') +
    '<button type="button" class="tool press" data-rhelp="' + i + '" style="width:auto;height:auto;padding:6px 0;color:var(--th-primary);font-weight:600;font-size:14px">How to do it</button>' +
    '</div></div>';
  for (var k = 1; k <= nSets; k++) {
    h += '<button type="button" class="btn ghost block press rh-set" data-rset>Set ' + k + ' \u2014 mark done</button>';
  }
  blk.innerHTML = h;
  return blk;
}
function renderLogSession(v) {
  var s = state.log.session;
  var html = backbar((s.planKind === 'featured' || s.planKind === 'rehab') ? 'Home' : 'Programs') +
    '<div class="log-head"><div class="log-head-main"><h2>' + esc(s.programName) + '</h2>' +
    '<p class="tagline">' + esc(prettyDate(s.date)) + '</p></div>' +
    '<div class="log-count"><span id="sets-done">0</span><span class="log-total" id="sets-total"></span></div></div>' +
    '<div id="start-wrap"><button type="button" class="btn primary block press" id="start-workout">Start workout</button></div>' +
    '<div class="btn-row"><button type="button" class="btn ghost sm press" id="plate-btn">Plate calculator</button></div>' +
    '<div id="log-body"></div>' +
    '<label class="note-label">Note<input class="input" id="log-note" maxlength="200" placeholder="How did it feel?" value="' + esc(s.note) + '"></label>' +
    '<button class="btn block press" id="save-log">Save workout</button>' +
    '<div class="status" id="log-status"></div>';
  v.innerHTML = html;
  document.getElementById('back-btn').onclick = function () {
    if (!confirmDiscard()) return;
    stopLogTimer(); state.log.view = 'pick'; state.log.session = null; render();
  };
  document.getElementById('start-workout').onclick = pressStartButton;
  document.getElementById('save-log').onclick = saveLogSession;
  document.getElementById('plate-btn').onclick = openPlateSheet;
  var body = document.getElementById('log-body');
  s.blocks.forEach(function (b, i) {
    if (b.type === 'circuit') body.appendChild(circuitBlockEl(b, i));
    else if (b.type === 'cardio') body.appendChild(cardioBlockEl(b, i));
    else if (b.type === 'rehab') body.appendChild(rehabBlockEl(b, i));
    else body.appendChild(liftBlockEl(b, i));
  });
  body.addEventListener('input', updateSetCount);
  body.addEventListener('input', restTimerCheck);
  body.addEventListener('click', function (e) {
    var add = e.target && e.target.closest ? e.target.closest('[data-add]') : null;
    if (add) {
      var i = add.getAttribute('data-add');
      var setsDiv = body.querySelector('.sets[data-sets="' + i + '"]');
      var rows = setsDiv.querySelectorAll('.set-row');
      var last = rows[rows.length - 1];
      var tmp = el('div');
      tmp.innerHTML = setRowHTML(i, rows.length + 1,
        last ? last.querySelector('input[data-w]').value : '',
        last ? last.querySelector('input[data-r]').value : '');
      setsDiv.appendChild(tmp.firstChild);
      updateSetCount();
      return;
    }
    var help = e.target && e.target.closest ? e.target.closest('[data-help]') : null;
    if (help) {
      var b = s.blocks[+help.getAttribute('data-help')];
      openExerciseSheet(b.dbId || '', b.exercise || '');
      return;
    }
    var rdone = e.target && e.target.closest ? e.target.closest('[data-rdone]') : null;
    if (rdone) {
      var round = rdone.closest('.round');
      var on = round.classList.toggle('done');
      rdone.textContent = on ? 'Done ✓' : 'Mark done';
      rdone.classList.toggle('primary', on);
      return;
    }
    var cdone = e.target && e.target.closest ? e.target.closest('[data-cdone]') : null;
    if (cdone) {
      var on2 = cdone.classList.toggle('done');
      cdone.textContent = on2 ? 'Completed ✓' : 'Mark complete';
      cdone.classList.toggle('primary', on2);
      return;
    }
    var rset = e.target && e.target.closest ? e.target.closest('[data-rset]') : null;
    if (rset) {
      var on3 = rset.classList.toggle('done');
      var lbl = rset.textContent.replace(/ — (mark done|done ✓)/, '');
      rset.innerHTML = esc(lbl) + ' — ' + (on3 ? 'done ✓' : 'mark done');
      rset.classList.toggle('primary', on3);
      return;
    }
    var rhelp = e.target && e.target.closest ? e.target.closest('[data-rhelp]') : null;
    if (rhelp) {
      var rb = s.blocks[+rhelp.getAttribute('data-rhelp')];
      openExerciseSheet('', rb.db || rb.exercise || '');
      return;
    }
  });
  updateSetCount();
}
function confirmDiscard() {
  var rows = document.querySelectorAll('#log-body .lift-block .set-row');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].querySelector('input[data-w]').value !== '' || rows[i].querySelector('input[data-r]').value !== '') {
      return window.confirm('Leave without saving? Your sets will be lost.');
    }
  }
  if (document.querySelectorAll('#log-body .round.done, #log-body [data-cdone].done, #log-body [data-rset].done').length) {
    return window.confirm('Leave without saving? Your workout will be lost.');
  }
  return true;
}
function pressStartButton() {
  if (logStartTime) return;
  logStartTime = new Date().toISOString();
  var btn = document.getElementById('start-workout');
  btn.disabled = true;
  btn.classList.add('timer-live');
  var tick = function () {
    if (!logStartTime) return;
    btn.textContent = fmtElapsed(Date.now() - Date.parse(logStartTime));
  };
  tick();
  logTimerId = setInterval(tick, 1000);
}
function saveLogSession() {
  var s = state.log.session;
  var items = [];
  document.querySelectorAll('#log-body .ex-block').forEach(function (blk) {
    var b = s.blocks[+blk.getAttribute('data-block')];
    if (b.type === 'circuit') {
      blk.querySelectorAll('.round.done').forEach(function (rd) {
        var r = +rd.getAttribute('data-round');
        rd.querySelectorAll('.set-row').forEach(function (sr) {
          var rp = sr.querySelector('input[data-cr]').value;
          items.push({ kind: 'circuit', exercise: sr.getAttribute('data-exname'), dbId: '', round: r, reps: rp || '' });
        });
      });
      return;
    }
    if (b.type === 'cardio') {
      var doneBtn = blk.querySelector('[data-cdone]');
      if (doneBtn && doneBtn.classList.contains('done')) {
        items.push({ kind: 'cardio', text: b.text, exercise: 'Cardio' });
      }
      return;
    }
    if (b.type === 'rehab') {
      blk.querySelectorAll('[data-rset].done').forEach(function (btn) {
        var lbl = btn.textContent.replace(/ — (mark done|done ✓)/, '');
        var setN = lbl.replace(/[^0-9]/g, '') || '';
        items.push({ kind: 'rehab', exercise: b.exercise, dbId: b.db || '', set: setN, reps: String(b.reps) });
      });
      return;
    }
    blk.querySelectorAll('.set-row').forEach(function (sr, si) {
      var wt = sr.querySelector('input[data-w]').value;
      var rp = sr.querySelector('input[data-r]').value;
      if (wt === '' && rp === '') return;
      items.push({ kind: 'lift', exercise: b.exercise, dbId: b.dbId || '', set: si + 1, weight: wt || '', reps: rp || '' });
    });
  });
  if (!items.length) { toast('Fill in at least one set first', 'err'); return; }
  var noteEl = document.getElementById('log-note');
  var log = {
    date: s.date,
    programId: s.programId,
    programName: s.programName,
    startedAt: logStartTime || '',
    durationSec: logStartTime ? Math.round((Date.now() - Date.parse(logStartTime)) / 1000) : null,
    note: noteEl ? noteEl.value.trim() : '',
    items: items
  };
  var prs = findPRs(items);
  var saved = Store.saveLog(log);
  stopLogTimer();
  state.log.view = 'pick'; state.log.session = null;
  render();
  openRPESheet(saved.id, prs);
}

/* ============================================================
   HISTORY — past logged workouts
   ============================================================ */
function renderHistory(v) {
  if (state.histOpen) { renderLogDetail(v, state.histOpen); return; }
  var logs = Store.getLogs();
  v.innerHTML = viewHead('History', 'History', logs.length ? logs.length + ' logged workout' + (logs.length > 1 ? 's' : '') : 'Your logged workouts live here.') +
    '<div id="hist-list"></div>';
  var list = document.getElementById('hist-list');
  if (!logs.length) {
    list.innerHTML = emptyState('chart', 'Nothing logged yet', 'Finish a workout and it will show up here with every set.');
    return;
  }
  logs.forEach(function (l) {
    var sets = (l.items || []).length;
    var b = el('button', 'row-card press hist-row');
    b.innerHTML = '<span class="row-ico">' + icon('dumbbell', 22) + '</span>' +
      '<span class="t"><b>' + esc(l.programName || 'Workout') + '</b>' +
      '<small>' + esc(prettyDate(l.date)) + ' · ' + sets + ' sets' + (l.durationSec != null ? ' · ' + esc(fmtDur(l.durationSec)) : '') + '</small></span>' +
      '<span class="row-chev">' + icon('chevR', 20) + '</span>';
    b.onclick = function () { state.histOpen = l.id; render(); };
    list.appendChild(b);
  });
}
function renderLogDetail(v, id) {
  var l = Store.getLog(id);
  if (!l) { state.histOpen = null; render(); return; }
  var byEx = {}, order = [], circuits = {}, circOrder = [], cardios = [], rehabs = {}, rhOrder = [];
  (l.items || []).forEach(function (it) {
    var kind = it.kind || 'lift';
    if (kind === 'circuit') {
      if (!circuits[it.exercise]) { circuits[it.exercise] = []; circOrder.push(it.exercise); }
      circuits[it.exercise].push(it);
    } else if (kind === 'cardio') {
      cardios.push(it);
    } else if (kind === 'rehab') {
      if (!rehabs[it.exercise]) { rehabs[it.exercise] = []; rhOrder.push(it.exercise); }
      rehabs[it.exercise].push(it);
    } else {
      if (!byEx[it.exercise]) { byEx[it.exercise] = []; order.push(it.exercise); }
      byEx[it.exercise].push(it);
    }
  });
  var html = backbar('History') +
    viewHead('Workout detail', esc(l.programName || 'Workout'),
      esc(prettyDate(l.date)) + (l.durationSec != null ? ' · ' + esc(fmtDur(l.durationSec)) : '') +
      (l.rpe != null ? ' · effort ' + esc(String(l.rpe)) + '/10' : '')) +
    '<div class="card hist-detail">';
  order.forEach(function (ex) {
    html += '<div class="ex-h">' + esc(ex) + '</div>';
    byEx[ex].forEach(function (it) {
      html += '<div class="set-line"><span>Set ' + it.set + '</span><b>' +
        (it.weight !== '' ? esc(it.weight) + ' lb' : '—') + ' × ' + (it.reps !== '' ? esc(it.reps) : '—') + '</b></div>';
    });
  });
  circOrder.forEach(function (ex) {
    html += '<div class="ex-h">' + esc(ex) + ' <span class="n">circuit</span></div>';
    circuits[ex].forEach(function (it) {
      html += '<div class="set-line"><span>Round ' + it.round + '</span><b>' +
        (it.reps !== '' ? esc(it.reps) + ' reps' : 'done') + '</b></div>';
    });
  });
  cardios.forEach(function (it) {
    html += '<div class="ex-h">Cardio</div><div class="set-line"><span>Done</span><b>' + esc(it.text || '') + '</b></div>';
  });
  rhOrder.forEach(function (ex) {
    html += '<div class="ex-h">' + esc(ex) + ' <span class="n">rehab</span></div>';
    rehabs[ex].forEach(function (it) {
      html += '<div class="set-line"><span>Set ' + esc(String(it.set)) + '</span><b>' + esc(it.reps || 'done') + '</b></div>';
    });
  });
  if (l.note) html += '<div class="ex-h">Note</div><p style="margin:4px 0 0">' + esc(l.note) + '</p>';
  html += '</div><button class="btn danger-line block press" id="hist-del">' + icon('trash', 18) + ' Delete workout</button>';
  v.innerHTML = html;
  document.getElementById('back-btn').onclick = function () { state.histOpen = null; render(); };
  document.getElementById('hist-del').onclick = function () {
    confirmSheet('Delete this workout?', 'It will be removed from your history.', function () {
      Store.deleteLog(id); state.histOpen = null; render(); toast('Workout deleted');
    });
  };
}

/* ============================================================
   REHAB CENTER — routines from rehab.js
   ============================================================ */
function renderRehab(v) {
  if (state.rehabView === 'landing') renderRehabLanding(v);
  else renderRehabDetail(v, state.rehabView);
}
function renderRehabLanding(v) {
  v.innerHTML = '<button class="backlink press" id="rh-back">\u2190 Home</button>' +
    viewHead('Rehab Center', 'Rehab', 'Evidence-based routines for the aches lifters actually get.') +
    '<div class="flag warn rh-disclaim">' + esc(REHAB_DISCLAIMER) + '</div>' +
    '<div id="rh-cards"></div>';
  document.getElementById('rh-back').onclick = function () { state.rehabView = null; state.tab = 'home'; render(); };
  var wrap = document.getElementById('rh-cards');
  wrap.className = 'cat-grid';
  REHAB_ROUTINES.forEach(function (r) {
    var b = el('button', 'cat-box press');
    b.innerHTML = '<span class="cat-ico">' + icon(r.icon || 'medal', 24) + '</span>' +
      '<h3>' + esc(r.name) + '</h3><p>' + esc(r.tagline) + '</p>';
    b.onclick = function () { state.rehabView = r.id; render(); };
    wrap.appendChild(b);
  });
  var pr = el('div', 'card');
  pr.innerHTML = '<div class="sec-head">' + esc(PAIN_RULE.title) + '</div><p class="sec-sub" style="margin:0">' + esc(PAIN_RULE.body) + '</p>';
  v.appendChild(pr);
  var pl = el('div', 'card');
  var h = '<div class="sec-head">' + esc(PEACE_LOVE.title) + '</div>';
  h += '<h4>PEACE \u2014 the first days</h4><ul class="rules-list">' +
    PEACE_LOVE.peace.map(function (x) { return '<li><b>' + esc(x[0]) + ':</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ul>';
  h += '<h4>LOVE \u2014 after that</h4><ul class="rules-list">' +
    PEACE_LOVE.love.map(function (x) { return '<li><b>' + esc(x[0]) + ':</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ul>';
  h += '<p class="sec-sub" style="margin-bottom:0">' + esc(PEACE_LOVE.note) + '</p>';
  pl.innerHTML = h;
  v.appendChild(pl);
}
function rehabExRow(e) {
  var row = el('button', 'plan-block press rh-ex');
  row.innerHTML = '<span class="pb-ico">' + icon('dumbbell', 20) + '</span>' +
    '<div class="pb-body"><b>' + esc(e.name) + '</b>' +
    '<span class="n">' + e.sets + ' \u00d7 ' + esc(String(e.reps)) + (e.freq ? ' \u00b7 ' + esc(e.freq) : '') + '</span>' +
    (e.coaching ? '<span>' + esc(e.coaching) + '</span>' : '') +
    '<span class="vlink">Demo + how-to</span></div>' +
    '<span class="row-chev">' + icon('chevR', 20) + '</span>';
  row.onclick = function () { openExerciseSheet('', e.db || e.name); };
  return row;
}
function renderRehabDetail(v, id) {
  var r = getRehabRoutine(id);
  if (!r) { state.rehabView = 'landing'; render(); return; }
  v.innerHTML = '<button class="backlink press" id="rh-back">\u2190 Rehab Center</button>' +
    '<div class="plan-hero"><h2>' + esc(r.name) + '</h2><p class="sec-sub">' + esc(r.tagline) + '</p></div>' +
    '<div class="flag warn rh-disclaim">' + esc(REHAB_DISCLAIMER) + '</div>' +
    '<div class="card"><p class="sec-sub" style="margin:0">' + esc(r.about) + '</p></div>' +
    '<div id="rh-body"></div>';
  document.getElementById('rh-back').onclick = function () { state.rehabView = 'landing'; render(); };
  var body = document.getElementById('rh-body');
  function secHead(t) { var d = el('div'); d.innerHTML = '<div class="sec-head">' + esc(t) + '</div>'; body.appendChild(d); }
  if (r.exercises) {
    secHead('The routine');
    r.exercises.forEach(function (e) { body.appendChild(rehabExRow(e)); });
  }
  if (r.blocks) {
    r.blocks.forEach(function (b) {
      secHead(b.title);
      b.items.forEach(function (e) { body.appendChild(rehabExRow(e)); });
    });
  }
  if (r.selftest) {
    var st = el('div', 'card');
    st.innerHTML = '<div class="sec-head">' + esc(r.selftest.title) + '</div><p class="sec-sub" style="margin:0">' + esc(r.selftest.body) + '</p>';
    body.appendChild(st);
  }
  if (r.progression) {
    var pg = el('div', 'card');
    pg.innerHTML = '<div class="sec-head">' + esc(r.progression.title) + '</div><p class="sec-sub" style="margin:0">' + esc(r.progression.body) + '</p>';
    body.appendChild(pg);
  }
  if (r.avoid && r.avoid.length) {
    var av = el('div', 'card');
    av.innerHTML = '<div class="sec-head">What to avoid</div><ul class="rules-list">' +
      r.avoid.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    body.appendChild(av);
  }
  if (r.redflags && r.redflags.length) {
    var rf = el('div', 'card rh-red');
    rf.innerHTML = '<div class="sec-head">Red flags \u2014 see a professional</div><ul class="rules-list">' +
      r.redflags.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    body.appendChild(rf);
  }
  if (r.science) {
    var sc = el('div', 'card');
    sc.innerHTML = '<div class="sec-head">The science underneath</div><p class="sec-sub" style="margin:0">' + esc(r.science) + '</p>';
    body.appendChild(sc);
  }
  var cta = el('div', 'btn-row sticky-cta');
  cta.innerHTML = '<button class="btn primary block press" id="rh-add">Add to today\u2019s workout</button>';
  body.appendChild(cta);
  document.getElementById('rh-add').onclick = function () { addRehabToWorkout(r.id); };
}
function addRehabToWorkout(routineId) {
  var r = getRehabRoutine(routineId);
  if (!r) return;
  var blocks = rehabRoutineBlocks(r);
  if (state.log.session && state.log.session.blocks) {
    state.log.session.blocks = state.log.session.blocks.concat(blocks);
    state.log.view = 'session';
    state.tab = 'log';
    render();
    toast('Added to today\u2019s workout');
  } else {
    stopLogTimer();
    state.log.view = 'session';
    state.log.session = {
      programId: 'rehab-' + r.id,
      programName: 'Rehab \u2014 ' + r.name,
      planKind: 'rehab',
      date: todayStr(),
      blocks: blocks,
      note: ''
    };
    state.tab = 'log';
    render();
    toast('Rehab session started');
  }
}

/* ============================================================
   TRAINING TOOLS — plate calculator, smart rest timer,
   warm-up generator, body measurements
   ============================================================ */
/* ---------- plate calculator ---------- */
var PLATES = [45, 35, 25, 10, 5, 2.5];
function plateCalc(target, bar) {
  var t = num(target), b = num(bar);
  if (t === null || b === null || t <= 0) return { error: 'Enter a target weight.' };
  var perSide = (t - b) / 2;
  if (perSide < 0) return { error: 'Target is lighter than the bar.' };
  var rem = perSide, out = [];
  PLATES.forEach(function (p) {
    var c = Math.floor(rem / p + 1e-9);
    if (c > 0) { out.push({ plate: p, count: c }); rem = round1(rem - c * p); }
  });
  return { perSide: out, remainder: rem, target: t };
}
function openPlateSheet() {
  openSheet('<h3>Plate calculator</h3>' +
    '<label class="field"><span>Target weight (lb)</span>' +
    '<input class="input" id="pc-target" type="number" inputmode="decimal" min="0" placeholder="225"></label>' +
    '<label class="field"><span>Bar weight (lb)</span>' +
    '<input class="input" id="pc-bar" type="number" inputmode="decimal" min="0" value="45"></label>' +
    '<div id="pc-out"></div>' +
    '<div class="btn-row"><button class="btn primary block press" id="pc-go">Calculate</button></div>');
  function go() {
    var r = plateCalc(document.getElementById('pc-target').value, document.getElementById('pc-bar').value);
    var out = document.getElementById('pc-out');
    if (r.error) { out.innerHTML = '<p class="sec-sub">' + esc(r.error) + '</p>'; return; }
    if (!r.perSide.length) { out.innerHTML = '<p class="sec-sub">Just the bar \u2014 no plates needed.</p>'; return; }
    out.innerHTML = '<div class="sec-head">Load each side</div><ul class="plate-list">' +
      r.perSide.map(function (x) { return '<li><b>' + x.count + ' \u00d7</b> ' + x.plate + ' lb</li>'; }).join('') + '</ul>' +
      (r.remainder > 0.01 ? '<p class="sec-sub">Closest loadable: ' + round1(r.target - r.remainder * 2) + ' lb (off by ' + r.remainder + ' lb/side).</p>' : '');
  }
  document.getElementById('pc-go').onclick = go;
}
/* ---------- smart rest timer ---------- */
var COMPOUND_RE = /squat|bench|deadlift|overhead press|military press|shoulder press|push press|leg press|barbell row|pull[\s-]?up|chin[\s-]?up/i;
function restSecsFor(exerciseName) {
  return COMPOUND_RE.test(exerciseName || '') ? 150 : 75;
}
var restTimerId = null, restEndsAt = 0, audioCtx = null;
function startRestTimer(sec) {
  stopRestTimer();
  restEndsAt = Date.now() + sec * 1000;
  var pill = document.getElementById('rest-timer');
  if (!pill) {
    pill = el('div');
    pill.id = 'rest-timer';
    pill.innerHTML = '<span class="rt-label">Rest</span><span class="rt-time tabular">0:00</span>' +
      '<button class="rt-skip press">Skip</button>';
    document.body.appendChild(pill);
    pill.querySelector('.rt-skip').onclick = stopRestTimer;
  }
  pill.classList.remove('done');
  pill.style.display = 'flex';
  (function tick() {
    var ms = restEndsAt - Date.now();
    if (ms <= 0) { restDone(pill); return; }
    var s = Math.ceil(ms / 1000);
    pill.querySelector('.rt-time').textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    restTimerId = setTimeout(tick, 250);
  })();
}
function restDone(pill) {
  stopRestTimer();
  pill.classList.add('done');
  pill.style.display = 'flex';
  pill.querySelector('.rt-time').textContent = 'Go!';
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* no vibrate */ }
  beep();
  setTimeout(function () { pill.style.display = 'none'; }, 5000);
}
function stopRestTimer() {
  if (restTimerId) { clearTimeout(restTimerId); restTimerId = null; }
  var pill = document.getElementById('rest-timer');
  if (pill) pill.style.display = 'none';
}
function beep() {
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    [0, 0.3, 0.6].forEach(function (t) {
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = 880; o.type = 'sine';
      var at = audioCtx.currentTime + t;
      g.gain.setValueAtTime(0.001, at);
      g.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.22);
      o.start(at); o.stop(at + 0.25);
    });
  } catch (e) { /* no audio */ }
}
/* auto-start when a lift set is completed */
function restTimerCheck(e) {
  var row = e.target && e.target.closest ? e.target.closest('.lift-block .set-row') : null;
  if (!row || row.getAttribute('data-timed')) return;
  var w = row.querySelector('input[data-w]'), r = row.querySelector('input[data-r]');
  if (w && r && w.value !== '' && r.value !== '') {
    row.setAttribute('data-timed', '1');
    var blk = row.closest('.ex-block');
    var b = state.log.session.blocks[+blk.getAttribute('data-block')];
    startRestTimer(restSecsFor(b.exercise));
    toast('Rest ' + (restSecsFor(b.exercise) >= 120 ? '2:30' : '1:15'));
  }
}
/* ---------- warm-up generator ---------- */
function buildWarmup(blocks) {
  var general = [
    'Jumping jacks \u2014 30 sec',
    'Arm circles \u2014 30 sec each direction',
    'Leg swings \u2014 30 sec each leg',
    'Bodyweight squats \u2014 30 sec'
  ];
  var lifts = (blocks || []).filter(function (b) { return b.type === 'lift' && !b._prog; }).slice(0, 3);
  var specific = lifts.map(function (b) {
    var w = num(coachFor(b.exercise).weight);
    if (w && w > 0) {
      var r1 = Math.max(5, Math.round(w * 0.5 / 5) * 5);
      var r2 = Math.max(5, Math.round(w * 0.75 / 5) * 5);
      return { name: b.exercise, detail: r1 + ' lb \u00d7 8, then ' + r2 + ' lb \u00d7 5' };
    }
    return { name: b.exercise, detail: 'Bodyweight \u00d7 10, then \u00d7 8' };
  });
  return { general: general, specific: specific };
}
function warmupHTML(blocks) {
  var wu = buildWarmup(blocks);
  if (!wu.specific.length) return '';
  return '<details class="day-detail warmup"><summary class="day-sum"><span>Warm-up \u2014 5 min</span>' +
    '<span class="n">tap to expand</span></summary><div class="day-blocks">' +
    '<div class="plan-block"><span class="pb-ico">' + icon('flame', 20) + '</span>' +
    '<div class="pb-body"><b>General \u2014 2 min</b><ul class="pb-list">' +
    wu.general.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul></div></div>' +
    wu.specific.map(function (s) {
      return '<div class="plan-block"><span class="pb-ico">' + icon('dumbbell', 20) + '</span>' +
        '<div class="pb-body"><b>' + esc(s.name) + '</b><span>Ramp: ' + esc(s.detail) + '</span></div></div>';
    }).join('') + '</div></details>';
}
/* ---------- body measurements ---------- */
var MEASURE_TYPES = [
  ['weight', 'Bodyweight', 'lb'],
  ['chest', 'Chest', 'in'],
  ['waist', 'Waist', 'in'],
  ['arms', 'Arms', 'in'],
  ['thighs', 'Thighs', 'in']
];
function openMeasureSheet() {
  var sel = MEASURE_TYPES[0][0];
  openSheet('<h3>Log measurement</h3>' +
    '<div class="pick-grid" id="ms-types">' +
    MEASURE_TYPES.map(function (t, i) {
      return '<button class="pick-box press' + (i === 0 ? ' on' : '') + '" data-mt="' + t[0] + '">' + t[1] + '<small>' + t[2] + '</small></button>';
    }).join('') + '</div>' +
    '<label class="field"><span>Value</span>' +
    '<input class="input" id="ms-val" type="number" inputmode="decimal" min="0" step="0.1" placeholder="0"></label>' +
    '<label class="field"><span>Date</span>' +
    '<input class="input" id="ms-date" type="date" value="' + todayStr() + '"></label>' +
    '<div class="btn-row"><button class="btn primary block press" id="ms-save">Save</button></div>');
  var root = document.getElementById('sheet-root');
  root.querySelectorAll('[data-mt]').forEach(function (b) {
    b.onclick = function () {
      sel = b.getAttribute('data-mt');
      root.querySelectorAll('[data-mt]').forEach(function (x) { x.classList.toggle('on', x === b); });
    };
  });
  document.getElementById('ms-save').onclick = function () {
    var v = num(document.getElementById('ms-val').value);
    var d = document.getElementById('ms-date').value || todayStr();
    if (v === null || v <= 0) { toast('Enter a value', 'err'); return; }
    Store.saveMeasurement({ type: sel, value: round1(v), date: d });
    closeSheet(); render(); toast('Measurement saved');
  };
}
function renderMeasureCard(v) {
  var all = Store.getMeasurements();
  var byType = {};
  all.forEach(function (m) { (byType[m.type] = byType[m.type] || []).push(m); });
  var card = el('div', 'card');
  var h = '<div class="sec-head">Body measurements</div>';
  var any = false;
  MEASURE_TYPES.forEach(function (t) {
    var arr = (byType[t[0]] || []).slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    if (!arr.length) return;
    any = true;
    var last = arr[arr.length - 1];
    h += '<div class="ms-row"><div class="ms-head"><b>' + t[1] + '</b>' +
      '<span class="tabular">' + esc(String(last.value)) + ' ' + t[2] + ' <span class="n">' + esc(prettyDate(last.date)) + '</span></span></div>';
    if (arr.length > 1) {
      var pts = arr.slice(-24).map(function (m) { return { date: m.date, v: +m.value }; });
      var d = round1(pts[pts.length - 1].v - pts[0].v);
      h += sparklineSVG(pts, t[2]) +
        '<div class="ms-delta' + (d > 0 ? ' up' : d < 0 ? ' down' : '') + '">' +
        (d > 0 ? '+' : '') + d + ' ' + t[2] + ' since ' + esc(prettyDate(pts[0].date)) + '</div>';
    }
    h += '</div>';
  });
  if (!any) h += '<p class="sec-sub">Track bodyweight, chest, waist, arms, and thighs over time.</p>';
  h += '<div class="btn-row"><button class="btn ghost block press" id="ms-add">Log measurement</button></div>';
  card.innerHTML = h;
  v.appendChild(card);
  card.querySelector('#ms-add').onclick = openMeasureSheet;
}

/* ============================================================
   SPORTS SCIENCE — projected max (Epley), training load (Foster),
   balance ratios, PR tracking. UI uses plain-language labels.
   ============================================================ */
function epley(w, r) { return w * (1 + r / 30); }
function round1(x) { return Math.round(x * 10) / 10; }
/* best set (by projected max) among lift items */
function bestSetE1RM(items) {
  var best = null;
  (items || []).forEach(function (it) {
    if (it.kind && it.kind !== 'lift') return;
    var w = num(it.weight), r = num(it.reps);
    if (w === null || r === null || w <= 0 || r <= 0) return;
    var e = epley(w, r);
    if (!best || e > best.e1rm) best = { weight: w, reps: r, e1rm: e };
  });
  return best;
}
/* all-time bests per exercise: {maxWeight, bestE1RM} */
function allTimeBests() {
  var out = {};
  Store.getLogs().forEach(function (l) {
    var byEx = {};
    (l.items || []).forEach(function (it) {
      if (it.kind && it.kind !== 'lift') return;
      var w = num(it.weight), r = num(it.reps);
      if (w === null || w <= 0 || r === null || r <= 0) return;
      (byEx[it.exercise] = byEx[it.exercise] || []).push(it);
    });
    Object.keys(byEx).forEach(function (ex) {
      var b = bestSetE1RM(byEx[ex]);
      if (!b) return;
      var cur = out[ex] || { maxWeight: 0, bestE1RM: 0 };
      if (b.weight > cur.maxWeight) cur.maxWeight = b.weight;
      if (b.e1rm > cur.bestE1RM) cur.bestE1RM = b.e1rm;
      out[ex] = cur;
    });
  });
  return out;
}
/* PRs in a fresh items list vs all-time bests (needs a real baseline) */
function findPRs(items) {
  var bests = allTimeBests();
  var byEx = {};
  items.forEach(function (it) {
    if (it.kind && it.kind !== 'lift') return;
    (byEx[it.exercise] = byEx[it.exercise] || []).push(it);
  });
  var prs = [];
  Object.keys(byEx).forEach(function (ex) {
    var b = bestSetE1RM(byEx[ex]);
    if (!b) return;
    var prev = bests[ex];
    if (!prev || prev.maxWeight <= 0) return;
    if (b.weight > prev.maxWeight) {
      prs.push({ exercise: ex, type: 'weight', weight: b.weight, reps: b.reps, prev: prev.maxWeight });
    } else if (b.e1rm > prev.bestE1RM) {
      prs.push({ exercise: ex, type: 'projmax', e1rm: b.e1rm, weight: b.weight, reps: b.reps, prev: prev.bestE1RM });
    }
  });
  return prs;
}
/* ---- training load (Foster) ---- */
function logLoad(l) {
  if (l.rpe == null || l.durationSec == null || l.durationSec <= 0) return null;
  return (+l.rpe) * (l.durationSec / 60);
}
function dailyLoads(endDate, n) {
  var byDate = {};
  Store.getLogs().forEach(function (l) {
    var ld = logLoad(l);
    if (ld === null || !l.date) return;
    byDate[l.date] = (byDate[l.date] || 0) + ld;
  });
  var out = [];
  for (var i = n - 1; i >= 0; i--) {
    var ds = addDays(endDate, -i);
    out.push({ date: ds, load: byDate[ds] || 0 });
  }
  return out;
}
function weekLoadStats(endDate) {
  var days = dailyLoads(endDate, 7);
  var loads = days.map(function (d) { return d.load; });
  var sum = loads.reduce(function (a, x) { return a + x; }, 0);
  var mean = sum / 7;
  var sd = Math.sqrt(loads.reduce(function (a, x) { return a + (x - mean) * (x - mean); }, 0) / 7);
  var monotony = sd > 1 ? mean / sd : (mean > 0 ? 9.9 : 0);
  return { days: days, sum: sum, mean: mean, sd: sd, monotony: monotony, strain: sum * monotony };
}
/* ---- balance volumes (last 4 weeks, via DB primaryMuscles) ---- */
function balanceVolumes() {
  var ms = muscleStats();
  var push = 0, pull = 0, quad = 0, ham = 0;
  Object.keys(ms.vol28).forEach(function (m) {
    var v = ms.vol28[m];
    if (PUSH_M.indexOf(m) >= 0) push += v;
    if (PULL_M.indexOf(m) >= 0) pull += v;
    if (m === 'quadriceps') quad += v;
    if (m === 'hamstrings') ham += v;
  });
  return { push: push, pull: pull, quad: quad, ham: ham };
}
function e1rmTrend(exercise) {
  var pts = [];
  Store.getLogs().forEach(function (l) {
    var items = (l.items || []).filter(function (it) {
      return (!it.kind || it.kind === 'lift') && it.exercise === exercise;
    });
    var b = bestSetE1RM(items);
    if (b) pts.push({ date: l.date, v: b.e1rm });
  });
  pts.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  return pts.slice(-24);
}
/* ---- RPE + PR celebration sheets ---- */
function openRPESheet(logId, prs) {
  var btns = '';
  for (var i = 1; i <= 10; i++) btns += '<button class="rpe-btn press" data-rpe="' + i + '">' + i + '</button>';
  openSheet('<h3>How hard was that?</h3><p class="sec-sub">Tap your effort \u2014 1 is easy, 10 is all-out.</p>' +
    '<div class="rpe-grid">' + btns + '</div>' +
    '<div class="btn-row"><button class="btn ghost block press" id="rpe-skip">Skip</button></div>');
  function done(rpe) {
    if (rpe != null) Store.updateLogRPE(logId, rpe);
    closeSheet();
    if (prs && prs.length) showPRSheet(prs);
    else { state.tab = 'history'; render(); toast('Workout saved \u2014 nice work'); }
  }
  document.getElementById('sheet-root').querySelectorAll('.rpe-btn').forEach(function (b) {
    b.onclick = function () { done(+b.getAttribute('data-rpe')); };
  });
  document.getElementById('rpe-skip').onclick = function () { done(null); };
}
function showPRSheet(prs) {
  var lis = prs.map(function (p) {
    var txt = p.type === 'weight'
      ? '<b>' + esc(p.exercise) + '</b> \u2014 ' + esc(String(p.weight)) + ' lb' + (p.reps ? ' \u00d7 ' + esc(String(p.reps)) : '') + ' <span class="n">(was ' + esc(String(p.prev)) + ')</span>'
      : '<b>' + esc(p.exercise) + '</b> \u2014 projected max <b>' + Math.round(p.e1rm) + ' lb</b> <span class="n">(was ' + Math.round(p.prev) + ')</span>';
    return '<li>' + txt + '</li>';
  }).join('');
  openSheet('<div class="pr-hero"><span class="pr-ico">' + icon('medal', 44) + '</span>' +
    '<h3>New PR' + (prs.length > 1 ? 's' : '') + '!</h3></div>' +
    '<ul class="pr-list">' + lis + '</ul>' +
    '<div class="btn-row"><button class="btn primary block press" id="pr-ok">Let\u2019s go</button></div>');
  document.getElementById('pr-ok').onclick = function () {
    closeSheet(); state.tab = 'history'; render(); toast('Workout saved \u2014 nice work');
  };
}

/* ============================================================
   PROGRESS — projected-max trends, training load, balance, PRs
   ============================================================ */
function trendExercises() {
  var counts = {};
  Store.getLogs().forEach(function (l) {
    var seen = {};
    (l.items || []).forEach(function (it) {
      if (it.kind && it.kind !== 'lift') return;
      if (num(it.weight) === null) return;
      seen[it.exercise] = true;
    });
    Object.keys(seen).forEach(function (ex) { counts[ex] = (counts[ex] || 0) + 1; });
  });
  return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
}
function sparklineSVG(pts, unit) {
  unit = unit || 'lb';
  var W = 320, H = 120, pad = 10;
  var vals = pts.map(function (p) { return p.v; });
  var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
  if (max - min < 0.5) max = min + 0.5;
  var stepX = pts.length > 1 ? (W - pad * 2) / (pts.length - 1) : 0;
  var coords = pts.map(function (p, i) {
    return [pad + i * stepX, H - pad - ((p.v - min) / (max - min)) * (H - pad * 2)];
  });
  var dots = coords.map(function (c) {
    return '<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="4"/>';
  }).join('');
  var line = pts.length > 1
    ? '<polyline points="' + coords.map(function (c) { return c[0].toFixed(1) + ',' + c[1].toFixed(1); }).join(' ') + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
    : '';
  return '<svg class="trend-svg" viewBox="0 0 ' + W + ' ' + H + '">' + line + dots + '</svg>' +
    '<div class="trend-range"><span>' + round1(min) + ' ' + unit + '</span><span>' + round1(max) + ' ' + unit + '</span></div>';
}
function renderTrendCard(v) {
  var exs = trendExercises().slice(0, 8);
  var card = el('div', 'card');
  var h = '<div class="sec-head">Projected max trend</div>';
  if (!exs.length) { card.innerHTML = h + '<p class="sec-sub">Log some lifts to start tracking.</p>'; v.appendChild(card); return; }
  if (!state.progEx || exs.indexOf(state.progEx) < 0) state.progEx = exs[0];
  h += '<div class="pick-grid">';
  exs.forEach(function (ex) {
    h += '<button class="pick-box press' + (ex === state.progEx ? ' on' : '') + '" data-tex="' + esc(ex) + '">' + esc(ex) + '</button>';
  });
  h += '</div><div id="trend-body"></div>';
  card.innerHTML = h;
  v.appendChild(card);
  function draw() {
    var pts = e1rmTrend(state.progEx);
    var body = card.querySelector('#trend-body');
    if (pts.length < 1) { body.innerHTML = '<p class="sec-sub">Not enough data.</p>'; return; }
    var first = pts[0].v, last = pts[pts.length - 1].v;
    var delta = last - first;
    body.innerHTML = sparklineSVG(pts) +
      '<div class="trend-now"><span class="stat-num tabular">' + Math.round(last) + ' lb</span>' +
      '<span class="stat-lab">current projected max' +
      (delta !== 0 ? ' <b class="' + (delta > 0 ? 'up' : 'down') + '">' + (delta > 0 ? '+' : '') + Math.round(delta) + ' lb</b>' : '') +
      ' · ' + pts.length + ' sessions</span></div>';
  }
  card.querySelectorAll('[data-tex]').forEach(function (b) {
    b.onclick = function () { state.progEx = b.getAttribute('data-tex'); render(); };
  });
  draw();
}
function renderLoadCard(v) {
  var today = todayStr();
  var thisW = weekLoadStats(today);
  var lastW = weekLoadStats(addDays(today, -7));
  var card = el('div', 'card');
  var h = '<div class="sec-head">Training load <span class="n">effort \u00d7 minutes</span></div>';
  if (thisW.sum === 0 && lastW.sum === 0) {
    h += '<p class="sec-sub">Tap your effort (1\u201310) after each workout and your training load will show up here.</p>';
    card.innerHTML = h; v.appendChild(card); return;
  }
  var ratio = lastW.sum > 0 ? thisW.sum / lastW.sum : null;
  h += '<div class="load-nums"><div><span class="stat-num tabular">' + Math.round(thisW.sum) + '</span>' +
    '<span class="stat-lab">this week</span></div>' +
    '<div><span class="stat-num tabular">' + Math.round(lastW.sum) + '</span>' +
    '<span class="stat-lab">last week</span></div>' +
    '<div><span class="stat-num tabular">' + thisW.monotony.toFixed(1) + '</span>' +
    '<span class="stat-lab">consistency</span></div></div>';
  // daily bars for this week
  h += '<div class="load-bars">';
  thisW.days.forEach(function (d) {
    var max = Math.max.apply(null, thisW.days.map(function (x) { return x.load; }).concat([1]));
    h += '<div class="load-bar"><span class="lb-fill" style="height:' + Math.max(4, Math.round(d.load / max * 100)) + '%"></span>' +
      '<span class="lb-day">' + 'SMTWTFS'[weekdayMon1(d.date) % 7] + '</span></div>';
  });
  h += '</div>';
  if (ratio !== null && ratio > 1.5) {
    h += '<div class="flag warn"><b>Ease off.</b> This week\u2019s load is ' + ratio.toFixed(1) + '\u00d7 last week\u2019s \u2014 ' +
      'that\u2019s a spike. Back the effort down for a few days before your body bills you for it.</div>';
  } else if (ratio !== null && ratio < 0.5 && thisW.sum > 0) {
    h += '<div class="flag ok"><b>Recovery week energy.</b> Load is way down vs last week \u2014 perfect if that\u2019s the plan.</div>';
  } else if (ratio !== null) {
    h += '<div class="flag ok"><b>Steady.</b> Load is in a healthy range vs last week.</div>';
  }
  card.innerHTML = h;
  v.appendChild(card);
}
function ratioFlag(a, b, aName, bName, advice) {
  if (b <= 0 || a <= 0) return '';
  var r = a / b;
  if (r <= 1.5) return '<div class="flag ok"><b>Balanced.</b> ' + aName + ' and ' + bName + ' are within a healthy range.</div>';
  return '<div class="flag warn"><b>' + aName + ' is running ' + r.toFixed(1) + '\u00d7 ' + bName + '.</b> ' + advice + '</div>';
}
function renderBalanceCard(v) {
  var b = balanceVolumes();
  var card = el('div', 'card');
  var h = '<div class="sec-head">Balance check <span class="n">last 4 weeks</span></div>';
  if (b.push + b.pull + b.quad + b.ham === 0) {
    h += '<p class="sec-sub">Log some lifts and we\u2019ll check your push/pull and quad/hamstring balance.</p>';
    card.innerHTML = h; v.appendChild(card); return;
  }
  function split(a, b2, aLab, bLab) {
    var t = a + b2 || 1;
    return '<div class="split-row"><span class="bar-lab">' + aLab + '</span>' +
      '<span class="split-track"><span class="split-a" style="width:' + Math.round(a / t * 100) + '%"></span></span>' +
      '<span class="bar-lab right">' + bLab + '</span></div>' +
      '<div class="split-nums tabular"><span>' + fmtVol(a) + '</span><span>' + fmtVol(b2) + '</span></div>';
  }
  h += split(b.push, b.pull, 'Push', 'Pull');
  h += ratioFlag(b.push, b.pull, 'Pushing', 'pulling',
    'Throw in more rows, pull-ups, and face pulls \u2014 your shoulders will thank you.');
  h += ratioFlag(b.pull, b.push, 'Pulling', 'pushing',
    'Don\u2019t forget your chest and shoulders \u2014 press something heavy this week.');
  h += split(b.quad, b.ham, 'Quads', 'Hamstrings');
  h += ratioFlag(b.quad, b.ham, 'Quads', 'hamstrings',
    'Your front is outrunning your back. Add Romanian deadlifts or leg curls before your knees write you a letter.');
  h += ratioFlag(b.ham, b.quad, 'Hamstrings', 'quads',
    'Strong backside \u2014 now give the quads some love with squats or leg press.');
  card.innerHTML = h;
  v.appendChild(card);
}
function renderPRCard(v) {
  var bests = allTimeBests();
  var exs = Object.keys(bests).sort(function (a, b) { return bests[b].bestE1RM - bests[a].bestE1RM; });
  var card = el('div', 'card');
  var h = '<div class="sec-head">Personal records</div>';
  if (!exs.length) {
    h += '<p class="sec-sub">Your all-time bests will live here.</p>';
  } else {
    h += '<div class="pr-rows">';
    exs.slice(0, 12).forEach(function (ex) {
      h += '<div class="pr-row"><span class="pr-ico">' + icon('medal', 18) + '</span>' +
        '<span class="grow"><b>' + esc(ex) + '</b><small>best ' + esc(String(round1(bests[ex].maxWeight))) + ' lb</small></span>' +
        '<span class="tabular"><b>' + Math.round(bests[ex].bestE1RM) + '</b> <small>proj. max</small></span></div>';
    });
    h += '</div>';
  }
  card.innerHTML = h;
  v.appendChild(card);
}
function renderProgress(v) {
  var logs = Store.getLogs();
  v.innerHTML = viewHead('Progress', 'Progress', 'Strength trends, training load, and balance.');
  if (!logs.length) {
    var es = el('div');
    es.innerHTML = emptyState('trend', 'No data yet', 'Log a few workouts and your strength trends, load, and balance will show up here.');
    v.appendChild(es);
    return;
  }
  renderTrendCard(v);
  renderLoadCard(v);
  renderBalanceCard(v);
  renderMeasureCard(v);
  renderPRCard(v);
}

/* ============================================================
   HOME — dashboard: greeting, stats, quote, analytics, plan card
   ============================================================ */
function renderOnboarding(v) {
  v.innerHTML = '<div class="onboard animate-pop-in">' +
    '<span class="ob-ico">' + icon('dumbbell', 44) + '</span>' +
    '<h2>Welcome to Lift Library</h2>' +
    '<p>Build programs, log lifts, watch yourself get stronger.</p>' +
    '<label class="field"><span>What should we call you?</span>' +
    '<input class="input" id="ob-name" maxlength="40" placeholder="Your name" autocomplete="given-name"></label>' +
    '<button class="btn primary block press" id="ob-go">Let\u2019s lift</button></div>';
  var inp = document.getElementById('ob-name');
  setTimeout(function () { inp.focus(); }, 300);
  function go() {
    var n = inp.value.trim();
    if (!n) { inp.focus(); toast('Tell us your name to continue', 'err'); return; }
    Store.setName(n);
    state.onboarding = false;
    render();
    toast('Welcome, ' + n + '!');
  }
  document.getElementById('ob-go').onclick = go;
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
}
function openSettings() {
  var cur = Store.getName();
  var hasPlan = !!Store.getActivePlan();
  openSheet('<h3>Settings</h3>' +
    '<label class="field"><span>Your name</span>' +
    '<input class="input" id="set-name" maxlength="40" value="' + esc(cur) + '"></label>' +
    '<div class="btn-row"><button class="btn block press" id="set-save">Save name</button></div>' +
    (hasPlan ? '<div class="btn-row"><button class="btn danger-line block press" id="set-endplan">End active plan</button></div>' : ''));
  document.getElementById('set-save').onclick = function () {
    var n = document.getElementById('set-name').value.trim();
    if (!n) { toast('Name can\u2019t be empty', 'err'); return; }
    Store.setName(n); closeSheet(); render(); toast('Saved');
  };
  var ep = document.getElementById('set-endplan');
  if (ep) ep.onclick = function () {
    closeSheet();
    confirmSheet('End this plan?', 'Your logged workouts stay. You can start a new plan anytime.', function () {
      Store.clearActivePlan(); render(); toast('Plan ended');
    });
  };
}

/* ---------- stats from localStorage logs ---------- */
function computeStats() {
  var logs = Store.getLogs();
  var totalSets = 0, volume = 0, daySet = {};
  logs.forEach(function (l) {
    if (l.date) daySet[l.date] = true;
    (l.items || []).forEach(function (it) {
      if (it.kind === 'cardio') return;
      totalSets++;
      var w = num(it.weight), r = num(it.reps);
      if (w !== null && r !== null) volume += w * r;
    });
  });
  var streak = 0, d = todayStr();
  if (!daySet[d]) d = addDays(d, -1);
  while (daySet[d]) { streak++; d = addDays(d, -1); }
  return { totalWorkouts: logs.length, totalSets: totalSets, volume: Math.round(volume), streak: streak };
}
function dbMusclesFor(it) {
  var e = null;
  if (it.dbId && EXDB.byId[it.dbId]) e = EXDB.byId[it.dbId];
  else if (it.exercise) e = EXDB.findByName(it.exercise);
  if (e && e.primaryMuscles && e.primaryMuscles.length) return e.primaryMuscles;
  return [];
}
var MUSCLE_LABEL = {
  quadriceps: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', chest: 'Chest',
  back: 'Back', lats: 'Lats', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', abdominals: 'Abs', obliques: 'Obliques', calves: 'Calves',
  traps: 'Traps', forearms: 'Forearms', abductors: 'Abductors', adductors: 'Adductors',
  'lower back': 'Lower back', 'middle back': 'Mid back', neck: 'Neck', hips: 'Hips'
};
function muscleLabel(m) { return MUSCLE_LABEL[m] || (m.charAt(0).toUpperCase() + m.slice(1)); }
var PUSH_M = ['chest', 'shoulders', 'triceps'];
var PULL_M = ['back', 'lats', 'biceps', 'traps', 'forearms', 'middle back', 'lower back', 'neck'];
var LEGS_M = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors', 'hips'];
function muscleStats() {
  var logs = Store.getLogs();
  var c28 = addDays(todayStr(), -28), c14 = addDays(todayStr(), -14);
  var vol28 = {}, vol14 = {};
  logs.forEach(function (l) {
    if (!l.date || l.date < c28) return;
    var in14 = l.date >= c14;
    (l.items || []).forEach(function (it) {
      if (it.kind === 'cardio') return;
      var w = num(it.weight), r = num(it.reps);
      if (w === null || r === null || w <= 0) return;
      var v = w * r, ms = dbMusclesFor(it);
      if (!ms.length) ms = ['other'];
      ms.forEach(function (m) {
        vol28[m] = (vol28[m] || 0) + v;
        if (in14) vol14[m] = (vol14[m] || 0) + v;
      });
    });
  });
  return { vol28: vol28, vol14: vol14 };
}
function fmtVol(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
  return String(Math.round(v));
}

/* ---------- active plan / today's workout ---------- */
function activePlanInfo() {
  var a = Store.getActivePlan();
  if (!a || !a.startDate) return { active: false };
  var today = todayStr();
  var totalDays = a.weeks * 7;
  var dayNum = diffDays(a.startDate, today);
  if (dayNum < 0) return { active: true, notStarted: true, a: a };
  if (dayNum >= totalDays) return { active: true, complete: true, a: a };
  var isFeat = a.kind === 'featured';
  var plan = isFeat ? getFeaturedPlan(a.programId) : Store.getProgram(a.programId);
  if (!plan) { Store.clearActivePlan(); return { active: false }; }
  var trainDays = isFeat ? (TRAIN_WEEKDAYS[plan.daysPerWeek] || [1, 2, 3, 4, 5]) : [1, 2, 3, 4, 5, 6, 7];
  var wd = weekdayMon1(today);
  var idx = trainDays.indexOf(wd);
  var week = Math.floor(dayNum / 7) + 1;
  return {
    active: true, a: a, plan: plan, isFeat: isFeat,
    week: week, weeks: a.weeks, dayNum: dayNum,
    isTrain: idx >= 0, dayIdx: idx, trainDays: trainDays, weekday: wd
  };
}
function planDayBlocks(info) {
  if (!info.isFeat) {
    return [{ type: 'lift', _prog: true }];
  }
  return info.plan.days[info.dayIdx].blocks;
}
function blockSummary(blocks) {
  var lifts = 0, circuits = 0, cardio = 0;
  blocks.forEach(function (b) {
    if (b.type === 'lift' || b._prog) lifts++;
    else if (b.type === 'circuit') circuits++;
    else if (b.type === 'cardio') cardio++;
  });
  var parts = [];
  if (lifts) parts.push(lifts + ' lift' + (lifts > 1 ? 's' : ''));
  if (circuits) parts.push(circuits + ' circuit' + (circuits > 1 ? 's' : ''));
  if (cardio) parts.push('cardio');
  return parts.join(' \u00b7 ') || 'Workout';
}
function logDoneFor(dateStr, programId) {
  var logs = Store.getLogs();
  for (var i = 0; i < logs.length; i++) {
    if (logs[i].date === dateStr && logs[i].programId === programId) return true;
  }
  return false;
}
function renderPlanCard(v) {
  var info = activePlanInfo();
  var html = '';
  if (!info.active) {
    html = '<div class="card plan-card"><h3>No active plan</h3>' +
      '<p class="sec-sub">Lock in a program for a few weeks and it\u2019ll show up here every day.</p>' +
      '<div class="btn-row"><button class="btn press" id="pc-browse">Browse 48 featured plans</button></div></div>';
  } else if (info.complete) {
    html = '<div class="card plan-card done"><h3>Plan complete \u2014 nice work.</h3>' +
      '<p class="sec-sub">' + info.a.weeks + ' weeks in the books. Time for the next one.</p>' +
      '<div class="btn-row"><button class="btn press" id="pc-browse">Pick a new plan</button>' +
      '<button class="btn ghost press" id="pc-end">Dismiss</button></div></div>';
  } else if (info.notStarted) {
    html = '<div class="card plan-card"><h3>Plan starts ' + esc(prettyDate(info.a.startDate)) + '</h3>' +
      '<p class="sec-sub">Locked in and ready.</p></div>';
  } else {
    var pname = info.isFeat ? info.plan.title : info.plan.name;
    var dayLabel = info.isFeat ? info.plan.days[info.dayIdx].name : 'Training day';
    var blocks = info.isFeat ? info.plan.days[info.dayIdx].blocks : info.plan.exercises.map(function (e) { return { type: 'lift', _prog: true }; });
    // week strip: this week's Mon..Sun
    var mon = mondayOf(todayStr());
    var strip = '<div class="week-strip">';
    for (var i = 0; i < 7; i++) {
      var ds = addDays(mon, i), wdi = i + 1;
      var isT = info.trainDays.indexOf(wdi) >= 0;
      var done = isT && logDoneFor(ds, info.a.programId);
      var isToday = ds === todayStr();
      strip += '<span class="wday' + (isT ? ' train' : '') + (done ? ' done' : '') + (isToday ? ' today' : '') + '">' +
        WD_SHORT[wdi] + '</span>';
    }
    strip += '</div>';
    html = '<div class="card plan-card' + (info.isTrain ? '' : ' rest') + '">' +
      '<div class="pc-top"><div><span class="kicker">Week ' + info.week + ' of ' + info.weeks + '</span>' +
      '<h3>' + esc(pname) + '</h3></div></div>' + strip;
    if (info.isTrain) {
      var wuBlocks = blocks;
      if (!info.isFeat) {
        var cp = Store.getProgram(info.a.programId);
        wuBlocks = (cp ? cp.exercises : []).map(function (e) { return { type: 'lift', exercise: e.name, dbId: e.dbId }; });
      }
      html += '<div class="pc-day"><b>' + esc(dayLabel) + '</b><span>' + esc(blockSummary(blocks)) + '</span></div>' +
        warmupHTML(wuBlocks) +
        '<button class="btn primary block press" id="pc-start">' + icon('play', 18) + ' Start workout</button>';
    } else {
      html += '<div class="pc-day rest"><b>Rest day</b><span>Recover. Tomorrow: ' +
        esc(info.isFeat ? info.plan.days[(info.dayIdx + 1) % info.plan.days.length].name : 'training') + '</span></div>';
    }
    html += '<button class="linklike press" id="pc-end">End plan</button></div>';
  }
  var wrap = el('div'); wrap.innerHTML = html;
  v.appendChild(wrap);
  function q(id) { return wrap.querySelector('#' + id); }
  if (q('pc-browse')) q('pc-browse').onclick = function () { state.tab = 'programs'; render(); };
  if (q('pc-end')) q('pc-end').onclick = function () {
    confirmSheet('End this plan?', 'Your logged workouts stay. You can start a new plan anytime.', function () {
      Store.clearActivePlan(); render(); toast('Plan ended');
    });
  };
  if (q('pc-start')) q('pc-start').onclick = function () {
    if (info.isFeat) startPlanDaySession(info.a.programId, info.dayIdx);
    else startLogSession(info.a.programId);
  };
}

/* ---------- home render ---------- */
function renderHome(v) {
  var name = Store.getName();
  var s = computeStats();
  var today = new Date();
  var dateStr = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  var html = '<div class="home-head"><div><span class="kicker">' + esc(dateStr) + '</span>' +
    '<h2>' + (name ? 'Hey, ' + esc(name) : 'Hey') + '</h2></div>' +
    '<div class="spacer"></div>' +
    '<button class="btn ghost iconbtn press" id="home-settings" aria-label="Settings">' + icon('pencil', 20) + '</button></div>';
  v.innerHTML = html;
  document.getElementById('home-settings').onclick = openSettings;

  // quote
  var qd = el('div', 'card quote-card');
  qd.innerHTML = '<p>\u201c' + esc(quoteOfDay()) + '\u201d</p>';
  v.appendChild(qd);

  // stat tiles
  var tiles = el('div', 'stat-grid');
  var defs = [
    ['Workouts', s.totalWorkouts], ['Day streak', s.streak],
    ['Sets logged', s.totalSets], ['Volume (lb)', fmtVol(s.volume)]
  ];
  defs.forEach(function (d) {
    var t = el('div', 'stat-tile');
    t.innerHTML = '<span class="stat-num tabular">' + esc(String(d[1])) + '</span><span class="stat-lab">' + esc(d[0]) + '</span>';
    tiles.appendChild(t);
  });
  v.appendChild(tiles);

  // active plan card
  renderPlanCard(v);

  // rehab center promo
  var rh = el('button', 'rehab-home press');
  rh.innerHTML = '<span class="row-ico">' + icon('medal', 24) + '</span>' +
    '<span class="t"><b>Rehab Center</b>' +
    '<small>Shoulders · Hips · Ankles · Knees · Prehab — evidence-based routines</small></span>' +
    '<span class="row-chev">' + icon('chevR', 20) + '</span>';
  rh.onclick = function () { state.rehabView = 'landing'; render(); };
  v.appendChild(rh);

  // analytics
  if (!s.totalWorkouts) {
    var es = el('div');
    es.innerHTML = emptyState('chart', 'No stats yet', 'Log your first workout to unlock your stats, streaks, and muscle analytics.');
    v.appendChild(es);
    return;
  }
  var ms = muscleStats();
  var entries = Object.keys(ms.vol28).map(function (m) { return { m: m, v: ms.vol28[m] }; })
    .sort(function (a, b) { return b.v - a.v; });
  if (entries.length) {
    var max = entries[0].v || 1;
    var card = el('div', 'card');
    var h = '<div class="sec-head">Volume by muscle <span class="n">last 4 weeks</span></div><div class="bars">';
    entries.slice(0, 8).forEach(function (e) {
      h += '<div class="bar-row"><span class="bar-lab">' + esc(muscleLabel(e.m)) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + Math.max(3, Math.round(e.v / max * 100)) + '%"></span></span>' +
        '<span class="bar-val tabular">' + esc(fmtVol(e.v)) + '</span></div>';
    });
    h += '</div>';
    card.innerHTML = h;
    v.appendChild(card);

    // push / pull / legs
    var pv = 0, qv = 0, lv = 0;
    entries.forEach(function (e) {
      if (PUSH_M.indexOf(e.m) >= 0) pv += e.v;
      else if (PULL_M.indexOf(e.m) >= 0) qv += e.v;
      else if (LEGS_M.indexOf(e.m) >= 0) lv += e.v;
    });
    var tot = pv + qv + lv || 1;
    var bal = el('div', 'card');
    bal.innerHTML = '<div class="sec-head">Push / Pull / Legs</div><div class="bars">' +
      [['Push', pv], ['Pull', qv], ['Legs', lv]].map(function (x) {
        return '<div class="bar-row"><span class="bar-lab">' + x[0] + '</span>' +
          '<span class="bar-track"><span class="bar-fill alt" style="width:' + Math.max(3, Math.round(x[1] / tot * 100)) + '%"></span></span>' +
          '<span class="bar-val tabular">' + Math.round(x[1] / tot * 100) + '%</span></div>';
      }).join('') + '</div>';
    v.appendChild(bal);

    // strong vs needs work
    if (entries.length >= 3) {
      var strong = entries.slice(0, 2).map(function (e) { return muscleLabel(e.m); });
      var weakPool = entries.filter(function (e) { return (ms.vol14[e.m] || 0) < e.v * 0.5; });
      var weak = (weakPool.length ? weakPool : entries.slice(-2)).slice(-2).map(function (e) { return muscleLabel(e.m); });
      var sw = el('div', 'sw-grid');
      sw.innerHTML = '<div class="card sw strong"><h4>Strong areas</h4><p>' + esc(strong.join(', ')) + '</p></div>' +
        '<div class="card sw work"><h4>Needs work</h4><p>' + esc(weak.join(', ')) + '</p></div>';
      v.appendChild(sw);
    }
  }
}

/* ---------------- init ---------------- */
function init() {
  renderTabbar();
  if (!Store.getName()) state.onboarding = true;
  if (checkImportHash()) { state.onboarding = false; state.tab = 'programs'; render(); }
  else render();
  EXDB.load();
}
document.addEventListener('DOMContentLoaded', init);
