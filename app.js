/* ============================================================
   Lift Library — app logic (vanilla JS, no build step)
   Free product: everything lives in localStorage on this device.
   No accounts, no backend. Programs move between devices via
   shareable links (#p=<base64url program JSON>).
   Tabs: Library / Programs / Log / History (+ Builder view).
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
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 3v4h-4"/>'
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

  function blank() { return { programs: [], logs: [] }; }
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var p = JSON.parse(raw);
      if (!p || typeof p !== 'object') return blank();
      return {
        programs: Array.isArray(p.programs) ? p.programs : [],
        logs: Array.isArray(p.logs) ? p.logs : []
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
    duplicateProgram: function (id) {
      var p = this.getProgram(id);
      if (!p) return null;
      var c = JSON.parse(JSON.stringify(p));
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
    deleteLog: function (id) {
      var s = read();
      s.logs = s.logs.filter(function (l) { return l.id !== id; });
      write(s);
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
  return EXDB.findByName(ref.name);
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
  { id: 'library', label: 'Library', icon: 'book' },
  { id: 'programs', label: 'Programs', icon: 'layers' },
  { id: 'log', label: 'Log', icon: 'play' },
  { id: 'history', label: 'History', icon: 'chart' }
];
var state = {
  tab: 'library',
  library: { view: 'cats', cat: null, q: '' },
  builder: null,          // {id, name, tagline, exercises[], picking:{cat,q}|null}
  builderReturn: 'programs',
  log: { view: 'pick', session: null },
  histOpen: null,         // open log id in history
  importing: null         // shared program being imported (#p= link)
};

function go(tab) {
  stopLogTimer();
  state.tab = tab;
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
  if (state.importing) { renderImport(v); return; }
  if (state.builder) { renderBuilder(v); return; }
  if (state.tab === 'library') renderLibrary(v);
  else if (state.tab === 'programs') renderPrograms(v);
  else if (state.tab === 'log') renderLog(v);
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
function openExerciseSheet(id) {
  var e = EXDB.byId[id];
  if (!e) return;
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
function renderPrograms(v) {
  var progs = Store.getPrograms();
  v.innerHTML = viewHead('My Programs', 'Programs',
    progs.length ? progs.length + ' saved program' + (progs.length > 1 ? 's' : '') : 'Build it once, lift it forever.',
    '<button class="btn sm press" id="prog-new">' + icon('plus', 18) + ' New</button>') +
    '<div id="prog-list"></div>';
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
        if (act === 'start') startLogSession(p.id);
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
  if (!progs.length) {
    pick.innerHTML = emptyState('play', 'No programs to log',
      'Build a program first, then log your workouts against it.', 'Build a program');
    document.getElementById('empty-cta').onclick = function () { openBuilder(null); };
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
function startLogSession(programId) {
  var p = Store.getProgram(programId);
  if (!p || !p.exercises.length) { toast('That program has no exercises', 'err'); return; }
  stopLogTimer();
  state.log.view = 'session';
  state.log.session = {
    programId: p.id,
    programName: p.name,
    date: todayStr(),
    exercises: JSON.parse(JSON.stringify(p.exercises)),
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
  if (!sess || !sess.length) return { line: '', weight: '', reps: '' };
  var topW = null, topReps = '', wCount = 0, repSum = 0, repN = 0;
  sess.forEach(function (s) {
    var wt = num(s.weight), rp = num(s.reps);
    if (wt !== null) { wCount++; if (topW === null || wt > topW) { topW = wt; topReps = s.reps == null ? '' : String(s.reps); } }
    if (rp !== null) { repSum += rp; repN++; }
  });
  if (topW === null) return { line: '', weight: '', reps: '' };
  var avg = repN ? repSum / repN : null;
  var line = 'Last time: ' + topW + ' lb × ' + sess.map(function (s) { return s.reps === '' || s.reps == null ? '–' : s.reps; }).join(', ');
  var n = name.toLowerCase();
  var isLeg = /leg|squat|lunge|deadlift|\brdl\b|calf|glute|hamstring|quad/.test(n);
  if (wCount >= 2 && avg !== null && avg >= 8) {
    var target = Math.round((topW + (isLeg ? 10 : 5)) * 10) / 10;
    return { line: line + ' — crushed it. Try ' + target + ' lb today.', weight: String(target), reps: topReps };
  }
  return { line: line, weight: String(topW), reps: topReps };
}
function renderLogSession(v) {
  var s = state.log.session;
  var html = backbar('Programs') +
    '<div class="log-head"><div class="log-head-main"><h2>' + esc(s.programName) + '</h2>' +
    '<p class="tagline">' + esc(prettyDate(s.date)) + '</p></div>' +
    '<div class="log-count"><span id="sets-done">0</span><span class="log-total" id="sets-total"></span></div></div>' +
    '<div id="start-wrap"><button type="button" class="btn primary block press" id="start-workout">Start workout</button></div>' +
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
  var body = document.getElementById('log-body');
  s.exercises.forEach(function (ex, i) {
    var coach = coachFor(ex.name);
    var blk = el('div', 'ex-block');
    blk.setAttribute('data-ex', i);
    var setsHTML = '';
    for (var k = 1; k <= ex.sets; k++) {
      setsHTML += setRowHTML(i, k, k === 1 ? coach.weight : '', k === 1 ? coach.reps : '');
    }
    var db = exFor(ex);
    blk.innerHTML =
      '<div class="ex-head-row"><span class="ex-num">' + ('0' + (i + 1)).slice(-2) + '</span>' +
      '<div class="ex-title-wrap"><div class="ex-name">' + esc(ex.name) + '</div>' +
      '<div class="ex-scheme">' + ex.sets + ' × ' + ex.reps + (db ? ' · ' + esc(lbCatLabel(db.category)) : '') + '</div>' +
      (db ? '<button type="button" class="tool press" data-help="' + i + '" style="width:auto;height:auto;padding:6px 0;color:var(--th-primary);font-weight:600;font-size:14px">How to do it</button>' : '') +
      (coach.line ? '<div class="coach-line">' + esc(coach.line) + '</div>' : '') +
      '</div></div>' +
      '<div class="sets-head"><span>SET</span><span>WEIGHT</span><span>REPS</span></div>' +
      '<div class="sets" data-sets="' + i + '">' + setsHTML + '</div>' +
      '<button type="button" class="btn ghost sm press add-set" data-add="' + i + '">+ Add set</button>';
    body.appendChild(blk);
  });
  body.addEventListener('input', updateSetCount);
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
      var ex = s.exercises[+help.getAttribute('data-help')];
      var db2 = exFor(ex);
      if (db2) openExerciseSheet(db2.id);
    }
  });
  updateSetCount();
}
function confirmDiscard() {
  var rows = document.querySelectorAll('#log-body .set-row');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].querySelector('input[data-w]').value !== '' || rows[i].querySelector('input[data-r]').value !== '') {
      return window.confirm('Leave without saving? Your sets will be lost.');
    }
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
    var ex = s.exercises[+blk.getAttribute('data-ex')];
    blk.querySelectorAll('.set-row').forEach(function (sr, si) {
      var wt = sr.querySelector('input[data-w]').value;
      var rp = sr.querySelector('input[data-r]').value;
      if (wt === '' && rp === '') return;
      items.push({ exercise: ex.name, dbId: ex.dbId || '', set: si + 1, weight: wt || '', reps: rp || '' });
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
  Store.saveLog(log);
  stopLogTimer();
  state.log.view = 'pick'; state.log.session = null;
  state.tab = 'history';
  render();
  toast('Workout saved — nice work');
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
  var byEx = {}, order = [];
  (l.items || []).forEach(function (it) {
    if (!byEx[it.exercise]) { byEx[it.exercise] = []; order.push(it.exercise); }
    byEx[it.exercise].push(it);
  });
  var html = backbar('History') +
    viewHead('Workout detail', esc(l.programName || 'Workout'),
      esc(prettyDate(l.date)) + (l.durationSec != null ? ' · ' + esc(fmtDur(l.durationSec)) : '')) +
    '<div class="card hist-detail">';
  order.forEach(function (ex) {
    html += '<div class="ex-h">' + esc(ex) + '</div>';
    byEx[ex].forEach(function (it) {
      html += '<div class="set-line"><span>Set ' + it.set + '</span><b>' +
        (it.weight !== '' ? esc(it.weight) + ' lb' : '—') + ' × ' + (it.reps !== '' ? esc(it.reps) : '—') + '</b></div>';
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

/* ---------------- init ---------------- */
function init() {
  renderTabbar();
  if (checkImportHash()) { state.tab = 'programs'; render(); }
  else render();
  EXDB.load();
}
document.addEventListener('DOMContentLoaded', init);
