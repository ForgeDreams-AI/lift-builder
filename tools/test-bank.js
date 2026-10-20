/* Store-layer harness for Lift Builder: stubs browser globals, loads app.js, exercises the Workout Bank. */
const fs = require('fs');
const vm = require('vm');

let storeData = {};
const localStorage = {
  getItem: (k) => (k in storeData ? storeData[k] : null),
  setItem: (k, v) => { storeData[k] = String(v); },
  removeItem: (k) => { delete storeData[k]; }
};
const ctx = {
  console, localStorage,
  document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } },
  location: { hash: '', pathname: '/' },
  history: { replaceState() {} },
  navigator: {},
  window: {},
  setTimeout, clearTimeout, setInterval, clearInterval,
  fetch: () => Promise.reject(new Error('no net in harness'))
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../app.js', 'utf8'), ctx);

const S = ctx.Store;
let pass = 0, fail = 0;
function t(name, cond) { if (cond) { pass++; console.log('ok  -', name); } else { fail++; console.log('BAD -', name); } }

/* migration: old store without workouts key */
storeData['liftBuilder.v1'] = JSON.stringify({ programs: [{ id: 'old1', name: 'Old', exercises: [{ dbId: '', name: 'Squat', sets: 3, reps: 5 }] }], logs: [] });
t('old store reads, bank empty', S.getWorkouts().length === 0 && S.getPrograms().length === 1);

/* save a featured day with mixed blocks */
const dayBlocks = [
  { type: 'lift', exercise: 'Barbell Squat', dbId: 'Barbell_Squat', sets: 4, reps: '5', warmup: '2x5 @ 60%' },
  { type: 'circuit', title: 'Finisher', rounds: 3, exercises: [{ exercise: 'KB Swing', dbId: '', reps: '15' }] },
  { type: 'cardio', text: '10 min incline walk' }
];
const r1 = S.bankBlocks('Plan 1 - Day 1', dayBlocks, { sourceKind: 'featured', sourceLabel: 'Plan 1', sourceRef: 'featured:plan-1:0' });
t('bank save created', r1.created === true && !!r1.workout);
t('mixed blocks preserved', r1.workout.blocks.length === 3 && r1.workout.blocks[1].type === 'circuit' && r1.workout.blocks[2].type === 'cardio');
t('lift reps kept as string', r1.workout.blocks[0].reps === '5');
const r2 = S.bankBlocks('Plan 1 - Day 1', dayBlocks, { sourceKind: 'featured', sourceRef: 'featured:plan-1:0' });
t('dedupe by sourceRef', r2.created === false && S.getWorkouts().length === 1);

/* custom lift-only workout */
const cw = S.saveWorkout({ name: 'Upper Pump', sourceKind: 'custom', blocks: [
  { type: 'lift', exercise: 'Bench Press', dbId: 'Bench_Press', sets: 4, reps: 8 },
  { type: 'lift', exercise: 'Barbell Row', dbId: '', sets: 4, reps: '8-12' }
]});
t('custom workout saved, range reps preserved', !!cw && cw.blocks[1].reps === '8-12');

/* assemble a program from the bank */
const prog = S.createProgramFromBank('My Split', [r1.workout.id, cw.id]);
t('program created', !!prog);
t('program has 2 days', prog.days && prog.days.length === 2);
t('daysPerWeek = 2', prog.daysPerWeek === 2);
t('derived exercises carry day tags', prog.exercises.length === 3 && prog.exercises.every(e => !!e.dayTag));
t('day blocks are snapshots', prog.days[0].blocks.length === 3 && prog.days[1].blocks.length === 2);

/* editing the bank workout does not mutate the built program */
S.saveWorkout({ id: cw.id, name: 'Upper Pump v2', sourceKind: 'custom', blocks: [{ type: 'lift', exercise: 'Bench Press', sets: 5, reps: 5 }] });
const progAfter = S.getProgram(prog.id);
t('program snapshot untouched by bank edit', progAfter.days[1].blocks.length === 2);

/* reorder days via saveProgram with exercises: [] re-derives */
const re = S.saveProgram({ id: prog.id, name: 'My Split', tagline: prog.tagline, exercises: [], days: [progAfter.days[1], progAfter.days[0]], daysPerWeek: 2, createdAt: prog.createdAt });
t('reordered days saved', re.days[0].name === 'Upper Pump' && re.exercises.length === 3 && re.exercises[0].dayTag === 'Upper Pump');

/* flat program still flat */
const flat = S.saveProgram({ name: 'Flat', exercises: [{ dbId: '', name: 'Deadlift', sets: 3, reps: 5 }] });
t('flat program has no days', !flat.days && flat.exercises.length === 1);

/* duplicate + delete workout */
const dup = S.duplicateWorkout(cw.id);
t('duplicate workout', !!dup && dup.id !== cw.id && S.getWorkouts().length === 3);
S.deleteWorkout(dup.id);
t('delete workout', S.getWorkouts().length === 2);

/* empty workout rejected */
t('empty workout rejected', S.saveWorkout({ name: 'Empty', blocks: [] }) === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
