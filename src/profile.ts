// profile.ts - Graph Data Structure Performance Benchmarking
// Run with: node --expose-gc profile.js
// Results are saved to: ./benchmark-results/

// -------------------- Config --------------------
// Command line args: --sizes="10,50,200" --samples=1000 --reps=100 --degree=4
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: any) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};

const SIZES = getArg('sizes', '10,50,200,500').split(',').map(n => parseInt(n));
const AVG_OUT_DEG = parseInt(getArg('degree', '8'));
const LOOKUP_SAMPLES = parseInt(getArg('samples', '10000'));   // reduced default
const TRAVERSAL_REPS = parseInt(getArg('reps', '500'));        // reduced default

if (args.includes('--help')) {
  console.log(`
Usage: node --expose-gc dist/profile.js [options]

Options:
  --sizes="10,50,200"    Node counts to test (default: 10,50,200,500)
  --samples=10000        Lookup operations per test (default: 10000)
  --reps=500            Traversal repetitions (default: 500)
  --degree=8            Average out-degree (default: 8)
  --help                Show this help

Examples:
  # Quick test
  npm run benchmark -- --sizes="10,50" --samples=1000 --reps=100
  
  # Full test (intensive!)
  npm run benchmark -- --sizes="10,50,200,500,1000,10000" --samples=200000 --reps=5000
`);
  process.exit(0);
}

// -------------------- Utilities --------------------
function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

function gcTry() {
  try { 
    if (typeof global !== 'undefined' && typeof global.gc === 'function') {
      global.gc();
    } else {
      console.warn('GC not available. Run with: node --expose-gc profile.js');
    }
  } catch (e) {
    console.warn('GC failed:', e.message);
  }
}

async function settle() {
  // Give the runtime a moment between phases to stabilize
  await sleep(10);
  gcTry();
  await sleep(10);
}

function nowMs() {
  return Date.now();
}

// Memory reader for Node.js
async function readMemoryMB(): Promise<number> {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / (1024 * 1024);
  }
  throw new Error('Node.js process.memoryUsage() not available');
}

// Helper to measure memory delta around a builder function
async function measureMemoryDeltaMB(fnBuild: () => GraphStructure | Promise<GraphStructure>): Promise<MemoryResult> {
  await settle();
  const before = await readMemoryMB();
  const structure = await fnBuild();
  await settle();
  const after = await readMemoryMB();
  const delta = (after - before);
  return { deltaMB: delta, structure };
}

// Random helper
function randInt(n: number): number { return (Math.random() * n) | 0; }

// Generate a pseudo-random sparse DAG-ish edge set with average out-degree d.
// We ensure u < v to keep it DAG-like (acyclic).
function genEdges(n: number, avgOutDeg: number): Edge[] {
  const m = Math.max(0, Math.floor(n * avgOutDeg));
  const edges = [];
  for (let i = 0; i < m; i++) {
    let u = randInt(n - 1);
    let v = u + 1 + randInt(n - 1 - u); // ensures v > u
    edges.push([u, v]);
  }
  return edges;
}

// -------------------- Structures --------------------

// AM bitset: compact n*n bits using Uint32Array
function makeAM(n: number, edges: Edge[]): any {
  const bits = new Uint32Array(Math.ceil((n * n) / 32));
  const set = (u, v) => {
    const idx = u * n + v;
    bits[idx >>> 5] |= (1 << (idx & 31));
  };
  const has = (u, v) => {
    const idx = u * n + v;
    return (bits[idx >>> 5] >>> (idx & 31)) & 1;
  };
  const outNeighbors = (u) => {
    const arr = [];
    const base = u * n;
    // Scan row; bitset means O(n). This is the cost of AM.
    for (let v = 0; v < n; v++) {
      const idx = base + v;
      if ((bits[idx >>> 5] >>> (idx & 31)) & 1) arr.push(v);
    }
    return arr;
  };
  const inNeighbors = (v) => {
    const arr = [];
    for (let u = 0; u < n; u++) {
      const idx = u * n + v;
      if ((bits[idx >>> 5] >>> (idx & 31)) & 1) arr.push(u);
    }
    return arr;
  };
  for (const [u, v] of edges) set(u, v);
  return { n, has, outNeighbors, inNeighbors, _bits: bits };
}

// AL: arrays of out + in neighbors
function makeAL(n: number, edges: Edge[]): any {
  const out = Array.from({ length: n }, () => []);
  const inn = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    out[u].push(v);
    inn[v].push(u);
  }
  // For faster hasEdge, build per-node hash sets (optional). We’ll compare both modes.
  const outSet = out.map(arr => {
    const s = new Set();
    for (const v of arr) s.add(v);
    return s;
  });
  const has = (u, v) => outSet[u].has(v);
  const outNeighbors = (u) => out[u];
  const inNeighbors = (v) => inn[v];
  return { n, has, outNeighbors, inNeighbors, _out: out, _in: inn };
}

// AM + AL “synced”
function makeAM_AL(n: number, edges: Edge[]): any {
  const am = makeAM(n, []);  // empty
  const out = Array.from({ length: n }, () => []);
  const inn = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    // update both
    const idx = u * n + v;
    am._bits[idx >>> 5] |= (1 << (idx & 31));
    out[u].push(v);
    inn[v].push(u);
  }
  const outSet = out.map(arr => {
    const s = new Set();
    for (const v of arr) s.add(v);
    return s;
  });
  const has = (u, v) => {
    // Force AM access to prevent dead code elimination
    const amResult = am.has(u, v);
    const alResult = outSet[u].has(v);
    // Use both results to prevent optimization
    return amResult || alResult; // Should be equivalent since they represent same graph
  };
  const outNeighbors = (u) => out[u];
  const inNeighbors = (v) => inn[v];
  return { n, has, outNeighbors, inNeighbors, _am: am, _out: out, _in: inn };
}

// OOP / “LiteGraph-ish”
function makeOOP(n: number, edges: Edge[]): any {
  class MyLink { constructor(from, to) { (this as any).from = from; (this as any).to = to; } }
  class MyNode {
    constructor(id) {
      (this as any).id = id;
      (this as any).outputs = []; // array of arrays of Links (one bucket per “slot”)
      (this as any).inputs  = []; // optional: mirror for quick in traversal
    }
  }
  class MyNetwork {
    constructor() { (this as any).nodes = []; (this as any).links = []; }
    addNode(node) { (this as any).nodes[node.id] = node; }
    connect(u, v) {
      const link = new MyLink(u, v);
      if (!(this as any).nodes[u].outputs[0]) (this as any).nodes[u].outputs[0] = [];
      (this as any).nodes[u].outputs[0].push(link);

      if (!(this as any).nodes[v].inputs[0]) (this as any).nodes[v].inputs[0] = [];
      (this as any).nodes[v].inputs[0].push(link);

      (this as any).links.push(link);
    }
    hasEdge(u, v) {
      const bucket = (this as any).nodes[u].outputs[0];
      if (!bucket) return false;
      // linear scan of links in that slot
      for (let i = 0; i < bucket.length; i++) if (bucket[i].to === v) return true;
      return false;
    }
    outNeighbors(u) {
      const bucket = (this as any).nodes[u].outputs[0];
      if (!bucket) return [];
      const out = new Array(bucket.length);
      for (let i = 0; i < bucket.length; i++) out[i] = bucket[i].to;
      return out;
    }
    inNeighbors(v) {
      const bucket = (this as any).nodes[v].inputs[0];
      if (!bucket) return [];
      const inn = new Array(bucket.length);
      for (let i = 0; i < bucket.length; i++) inn[i] = bucket[i].from;
      return inn;
    }
  }

  const net = new MyNetwork();
  for (let i = 0; i < n; i++) net.addNode(new MyNode(i));
  for (const [u, v] of edges) net.connect(u, v);

  return {
    n,
    has: (u, v) => net.hasEdge(u, v),
    outNeighbors: (u) => net.outNeighbors(u),
    inNeighbors: (v) => net.inNeighbors(v),
    _net: net,
  };
}

// -------------------- Microbench helpers --------------------
function benchHasEdge(struct: any, n: number, samples: number): any {
  const pairs = new Array(samples);
  for (let i = 0; i < samples; i++) {
    const u = randInt(n), v = u + 1 + (randInt(n - u - 1) | 0);
    pairs[i] = [u, v < n ? v : n - 1];
  }
  const t0 = nowMs();
  let cnt = 0;
  for (let i = 0; i < samples; i++) {
    if (struct.has(pairs[i][0], pairs[i][1])) cnt++;
  }
  const t1 = nowMs();
  return { ms: (t1 - t0), hits: cnt };
}

function benchTraversals(struct: any, n: number, reps: number): any {
  // outputs
  let t0 = nowMs(), touched = 0;
  for (let r = 0; r < reps; r++) {
    for (let u = 0; u < n; u++) {
      const arr = struct.outNeighbors(u);
      touched += arr.length;
      // do something trivial
      if (arr.length && arr[0] === -1) console.log('impossible');
    }
  }
  let t1 = nowMs();
  const outMs = t1 - t0;

  // inputs
  t0 = nowMs();
  for (let r = 0; r < reps; r++) {
    for (let v = 0; v < n; v++) {
      const arr = struct.inNeighbors(v);
      touched += arr.length;
      if (arr.length && arr[0] === -1) console.log('impossible');
    }
  }
  t1 = nowMs();
  const inMs = t1 - t0;

  return { outMs, inMs, touched };
}

// -------------------- Result Recording --------------------
import * as fs from 'fs';
import * as path from 'path';

// Type definitions
interface BenchmarkRow {
  n: number;
  edges: number;
  'MB: AM': string;
  'MB: AL': string;
  'MB: AM+AL': string;
  'MB: OOP': string;
  'ns/op hasEdge AM': string;
  'ns/op hasEdge AL': string;
  'ns/op hasEdge AM+AL': string;
  'ns/op hasEdge OOP': string;
  'ns/op traverseOut AM': string;
  'ns/op traverseOut AL': string;
  'ns/op traverseOut AM+AL': string;
  'ns/op traverseOut OOP': string;
  'ns/op traverseIn AM': string;
  'ns/op traverseIn AL': string;
  'ns/op traverseIn AM+AL': string;
  'ns/op traverseIn OOP': string;
}

interface GraphStructure {
  n: number;
  has: (u: number, v: number) => boolean;
  outNeighbors: (u: number) => number[];
  inNeighbors: (v: number) => number[];
  [key: string]: any;
}

interface MemoryResult {
  deltaMB: number;
  structure: any;
}

interface BenchResult {
  ms: number;
  hits: number;
}

interface TraversalResult {
  outMs: number;
  inMs: number;
  touched: number;
}

type Edge = [number, number];

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveResults(results: any): { jsonPath: string; csvPath: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsDir = './benchmark-results';
  ensureDir(resultsDir);
  
  // Save JSON
  const jsonPath = path.join(resultsDir, `benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: { SIZES, AVG_OUT_DEG, LOOKUP_SAMPLES, TRAVERSAL_REPS },
    results
  }, null, 2));
  
  // Save CSV
  const csvPath = path.join(resultsDir, `benchmark-${timestamp}.csv`);
  const headers = Object.keys(results[0]).join(',');
  const csvRows = results.map(row => Object.values(row).join(','));
  fs.writeFileSync(csvPath, [headers, ...csvRows].join('\n'));
  
  console.log(`\nResults saved to:\n  JSON: ${jsonPath}\n  CSV: ${csvPath}`);
  return { jsonPath, csvPath };
}

// -------------------- Runner --------------------
(async function main() {
  console.log('Starting graph benchmark...');
  console.log(`Testing sizes: ${SIZES.join(', ')} nodes`);
  console.log(`Average out-degree: ${AVG_OUT_DEG}`);
  console.log(`Lookup samples: ${LOOKUP_SAMPLES.toLocaleString()}`);
  console.log(`Traversal reps base: ${TRAVERSAL_REPS.toLocaleString()}`);
  
  const totalOps = SIZES.reduce((sum, n) => sum + (LOOKUP_SAMPLES * 4) + (TRAVERSAL_REPS * n * 2 * 4), 0);
  console.log(`\nEstimated total operations: ${totalOps.toLocaleString()}`);
  console.log('Use --help for configuration options');
  console.log('\n' + '='.repeat(80));
  
  const rows = [];
  for (const n of SIZES) {
    const edges = genEdges(n, AVG_OUT_DEG);

    // AM
    let amRes = await measureMemoryDeltaMB(() => makeAM(n, edges).valueOf ? makeAM(n, edges) : makeAM(n, edges));
    const amStruct = amRes.structure;
    let lookup = benchHasEdge(amStruct, n, LOOKUP_SAMPLES);
    const amLookupNs = (lookup.ms * 1e6) / LOOKUP_SAMPLES;
    const trav = benchTraversals(amStruct, n, Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));
    const amOutNs = (trav.outMs * 1e6) / (n * Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));
    const amInNs  = (trav.inMs  * 1e6) / (n * Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));

    // release
    (amRes as any).structureRef = null;

    await settle();

    // AL
    let alRes = await measureMemoryDeltaMB(() => makeAL(n, edges));
    const alStruct = alRes.structure;
    lookup = benchHasEdge(alStruct, n, LOOKUP_SAMPLES);
    const alLookupNs = (lookup.ms * 1e6) / LOOKUP_SAMPLES;
    const trav2 = benchTraversals(alStruct, n, Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));
    const alOutNs = (trav2.outMs * 1e6) / (n * Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));
    const alInNs  = (trav2.inMs  * 1e6) / (n * Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));

    (alRes as any).structureRef = null;
    await settle();

    // AM + AL
    let amalRes = await measureMemoryDeltaMB(() => makeAM_AL(n, edges));
    const amalStruct = amalRes.structure;
    lookup = benchHasEdge(amalStruct, n, LOOKUP_SAMPLES);
    const amalLookupNs = (lookup.ms * 1e6) / LOOKUP_SAMPLES;
    const trav3 = benchTraversals(amalStruct, n, Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));
    const amalOutNs = (trav3.outMs * 1e6) / (n * Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));
    const amalInNs  = (trav3.inMs  * 1e6) / (n * Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));

    (amalRes as any).structureRef = null;
    await settle();

    // OOP
    let oopRes = await measureMemoryDeltaMB(() => makeOOP(n, edges));
    const oopStruct = oopRes.structure;
    lookup = benchHasEdge(oopStruct, n, LOOKUP_SAMPLES);
    const oopLookupNs = (lookup.ms * 1e6) / LOOKUP_SAMPLES;
    const trav4 = benchTraversals(oopStruct, n, Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));
    const oopOutNs = (trav4.outMs * 1e6) / (n * Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));
    const oopInNs  = (trav4.inMs  * 1e6) / (n * Math.max(1, Math.floor(TRAVERSAL_REPS / Math.max(1, n))));

    // record row
    rows.push({
      n,
      edges: edges.length,
      'MB: AM': (amRes.deltaMB).toFixed(2),
      'MB: AL': (alRes.deltaMB).toFixed(2),
      'MB: AM+AL': (amalRes.deltaMB).toFixed(2),
      'MB: OOP': (oopRes.deltaMB).toFixed(2),
      'ns/op hasEdge AM': amLookupNs.toFixed(1),
      'ns/op hasEdge AL': alLookupNs.toFixed(1),
      'ns/op hasEdge AM+AL': amalLookupNs.toFixed(1),
      'ns/op hasEdge OOP': oopLookupNs.toFixed(1),
      'ns/op traverseOut AM': amOutNs.toFixed(1),
      'ns/op traverseOut AL': alOutNs.toFixed(1),
      'ns/op traverseOut AM+AL': amalOutNs.toFixed(1),
      'ns/op traverseOut OOP': oopOutNs.toFixed(1),
      'ns/op traverseIn AM': amInNs.toFixed(1),
      'ns/op traverseIn AL': alInNs.toFixed(1),
      'ns/op traverseIn AM+AL': amalInNs.toFixed(1),
      'ns/op traverseIn OOP': oopInNs.toFixed(1),
    });

    // release references
    (alRes as any) = (amalRes as any) = (oopRes as any) = null;
    // Drop big structures explicitly
    // (we rely on them going out of scope + gcTry)
    await settle();
  }

  // Save results to disk
  saveResults(rows);
  
  // Pretty-print
  console.log('\n' + '='.repeat(80));
  console.log('BENCHMARK RESULTS:');
  console.log('='.repeat(80));
  if (typeof console.table === 'function') console.table(rows);
  else console.log(rows);
  
  // Performance summary
  console.log('\nPERFORMANCE ANALYSIS:');
  console.log('='.repeat(50));
  console.log('At 200 lookups/sec and 50 traversals/sec per node:');
  
  for (const row of rows) {
    const lookupBudget = (200 * parseFloat(row['ns/op hasEdge AL'])) / 1e6; // ms/sec
    const traverseBudget = (50 * parseFloat(row['ns/op traverseOut AL'])) / 1e6;
    console.log(`n=${row.n}: Lookup budget: ${lookupBudget.toFixed(2)}ms/s, Traverse: ${traverseBudget.toFixed(2)}ms/s`);
  }
  
  console.log('\nBenchmark completed successfully!');
})();

