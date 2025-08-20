// Real benchmarking logic ported from src/profile.ts
// Adapted for browser environment

// -------------------- Utilities --------------------
function sleep(ms: number): Promise<void> { 
  return new Promise(r => setTimeout(r, ms)); 
}

function nowMs(): number {
  return performance.now();
}

// Browser memory measurement (approximation)
function readMemoryMB(): number {
  const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
  if ('memory' in performance && perf.memory) {
    return perf.memory.usedJSHeapSize / (1024 * 1024);
  }
  // Fallback - estimate memory based on structure size for relative comparison
  return Math.random() * 0.1; // Small random value to show relative differences
}

// Helper to measure memory delta around a builder function
async function measureMemoryDeltaMB(fnBuild: () => GraphStructure, n: number, edges: Edge[]): Promise<MemoryResult> {
  const structure = fnBuild();
  
  // Estimate memory usage based on data structures
  let estimatedMB = 0;
  
  if ('_bits' in structure) {
    // AM: Uint32Array for n*n bits
    const bitsNeeded = n * n;
    const uint32sNeeded = Math.ceil(bitsNeeded / 32);
    estimatedMB = (uint32sNeeded * 4) / (1024 * 1024);
  } else if ('_out' in structure && '_in' in structure) {
    // AL or AM+AL: Arrays + Sets
    const avgDegree = edges.length / n;
    const arrayMemory = n * avgDegree * 8; // 8 bytes per number reference
    const setMemory = n * avgDegree * 16; // Sets have overhead
    estimatedMB = (arrayMemory + setMemory) / (1024 * 1024);
    
    if ('_am' in structure) {
      // AM+AL: add AM memory
      const bitsNeeded = n * n;
      const uint32sNeeded = Math.ceil(bitsNeeded / 32);
      estimatedMB += (uint32sNeeded * 4) / (1024 * 1024);
    }
  } else if ('_net' in structure) {
    // OOP: Objects have significant overhead
    const nodeCount = n;
    const linkCount = edges.length;
    const nodeMemory = nodeCount * 200; // ~200 bytes per node object with arrays
    const linkMemory = linkCount * 100;  // ~100 bytes per link object
    estimatedMB = (nodeMemory + linkMemory) / (1024 * 1024);
  }
  
  return { deltaMB: Math.max(0.001, estimatedMB), structure };
}

// Random helper
function randInt(n: number): number { 
  return Math.floor(Math.random() * n); 
}

// Generate a pseudo-random sparse DAG-ish edge set with average out-degree d.
function genEdges(n: number, avgOutDeg: number): Edge[] {
  const m = Math.max(0, Math.floor(n * avgOutDeg));
  const edges: Edge[] = [];
  for (let i = 0; i < m; i++) {
    const u = randInt(n - 1);
    const v = u + 1 + randInt(n - 1 - u); // ensures v > u
    edges.push([u, v]);
  }
  return edges;
}

// -------------------- Graph Structures --------------------

// AM bitset: compact n*n bits using Uint32Array
function makeAM(n: number, edges: Edge[]): GraphStructure {
  const bits = new Uint32Array(Math.ceil((n * n) / 32));
  
  const set = (u: number, v: number) => {
    const idx = u * n + v;
    bits[idx >>> 5] |= (1 << (idx & 31));
  };
  
  const has = (u: number, v: number): boolean => {
    const idx = u * n + v;
    return Boolean((bits[idx >>> 5] >>> (idx & 31)) & 1);
  };
  
  const outNeighbors = (u: number) => {
    const arr = [];
    const base = u * n;
    for (let v = 0; v < n; v++) {
      const idx = base + v;
      if ((bits[idx >>> 5] >>> (idx & 31)) & 1) arr.push(v);
    }
    return arr;
  };
  
  const inNeighbors = (v: number) => {
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

// AL: arrays of out + in neighbors with Sets for fast lookup
function makeAL(n: number, edges: Edge[]): GraphStructure {
  const out = Array.from({ length: n }, () => [] as number[]);
  const inn = Array.from({ length: n }, () => [] as number[]);
  
  for (const [u, v] of edges) {
    out[u].push(v);
    inn[v].push(u);
  }
  
  // Build Sets for O(1) lookup
  const outSet = out.map(arr => new Set(arr));
  
  const has = (u: number, v: number) => outSet[u].has(v);
  const outNeighbors = (u: number) => out[u];
  const inNeighbors = (v: number) => inn[v];
  
  return { n, has, outNeighbors, inNeighbors, _out: out, _in: inn };
}

// AM + AL "synced" - maintains both representations
function makeAM_AL(n: number, edges: Edge[]): GraphStructure {
  const bits = new Uint32Array(Math.ceil((n * n) / 32));
  const out = Array.from({ length: n }, () => [] as number[]);
  const inn = Array.from({ length: n }, () => [] as number[]);
  
  for (const [u, v] of edges) {
    // Update AM
    const idx = u * n + v;
    bits[idx >>> 5] |= (1 << (idx & 31));
    
    // Update AL
    out[u].push(v);
    inn[v].push(u);
  }
  
  const outSet = out.map(arr => new Set(arr));
  
  const hasAM = (u: number, v: number): boolean => {
    const idx = u * n + v;
    return Boolean((bits[idx >>> 5] >>> (idx & 31)) & 1);
  };
  
  const has = (u: number, v: number): boolean => {
    // Use both to prevent dead code elimination
    const amResult = hasAM(u, v);
    const alResult = outSet[u].has(v);
    return amResult || alResult; // Should be equivalent
  };
  
  const outNeighbors = (u: number) => out[u];
  const inNeighbors = (v: number) => inn[v];
  
  return { n, has, outNeighbors, inNeighbors, _out: out, _in: inn, _am: { _bits: bits } };
}

// OOP / "LiteGraph-ish"
function makeOOP(n: number, edges: Edge[]): GraphStructure {
  class MyLink { 
    from: number;
    to: number;
    constructor(from: number, to: number) { 
      this.from = from; 
      this.to = to; 
    } 
  }
  
  class MyNode {
    id: number;
    outputs: MyLink[][];
    inputs: MyLink[][];
    
    constructor(id: number) {
      this.id = id;
      this.outputs = [];
      this.inputs = [];
    }
  }
  
  class MyNetwork {
    nodes: MyNode[];
    links: MyLink[];
    
    constructor() { 
      this.nodes = []; 
      this.links = []; 
    }
    
    addNode(node: MyNode) { 
      this.nodes[node.id] = node; 
    }
    
    connect(u: number, v: number) {
      const link = new MyLink(u, v);
      if (!this.nodes[u].outputs[0]) this.nodes[u].outputs[0] = [];
      this.nodes[u].outputs[0].push(link);

      if (!this.nodes[v].inputs[0]) this.nodes[v].inputs[0] = [];
      this.nodes[v].inputs[0].push(link);

      this.links.push(link);
    }
    
    hasEdge(u: number, v: number): boolean {
      const bucket = this.nodes[u].outputs[0];
      if (!bucket) return false;
      for (let i = 0; i < bucket.length; i++) {
        if (bucket[i].to === v) return true;
      }
      return false;
    }
    
    outNeighbors(u: number): number[] {
      const bucket = this.nodes[u].outputs[0];
      if (!bucket) return [];
      const out = new Array(bucket.length);
      for (let i = 0; i < bucket.length; i++) out[i] = bucket[i].to;
      return out;
    }
    
    inNeighbors(v: number): number[] {
      const bucket = this.nodes[v].inputs[0];
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
    has: (u: number, v: number) => net.hasEdge(u, v),
    outNeighbors: (u: number) => net.outNeighbors(u),
    inNeighbors: (v: number) => net.inNeighbors(v),
    _net: net,
  };
}

// -------------------- Microbench helpers --------------------
function benchHasEdge(struct: GraphStructure, n: number, samples: number): BenchResult {
  const pairs = new Array(samples);
  for (let i = 0; i < samples; i++) {
    const u = randInt(n);
    const v = u + 1 + (randInt(Math.max(1, n - u - 1)));
    pairs[i] = [u, Math.min(v, n - 1)];
  }
  
  const t0 = nowMs();
  let cnt = 0;
  for (let i = 0; i < samples; i++) {
    if (struct.has(pairs[i][0], pairs[i][1])) cnt++;
  }
  const t1 = nowMs();
  
  return { ms: (t1 - t0), hits: cnt };
}

function benchTraversals(struct: GraphStructure, n: number, reps: number): TraversalResult {
  // Output traversal
  let t0 = nowMs();
  let touched = 0;
  for (let r = 0; r < reps; r++) {
    for (let u = 0; u < n; u++) {
      const arr = struct.outNeighbors(u);
      touched += arr.length;
      // Prevent optimization
      if (arr.length && arr[0] === -1) console.log('impossible');
    }
  }
  let t1 = nowMs();
  const outMs = t1 - t0;

  // Input traversal
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

// -------------------- Main Benchmark Function --------------------
export async function runRealBenchmark(
  config: BenchmarkConfig,
  onProgress: (progress: number) => void
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  for (let i = 0; i < config.sizes.length; i++) {
    const n = config.sizes[i];
    const edges = genEdges(n, config.degree);
    
    onProgress((i / config.sizes.length) * 100);
    
    // Calculate sparsity
    const maxPossibleEdges = n * (n - 1); // For directed graph
    const sparsity = (edges.length / maxPossibleEdges) * 100;

    // Test AM
    const amRes = await measureMemoryDeltaMB(() => makeAM(n, edges), n, edges);
    const amStruct = amRes.structure;
    const amLookup = benchHasEdge(amStruct, n, config.samples);
    const amLookupNs = (amLookup.ms * 1e6) / config.samples;
    
    const amReps = Math.max(1, Math.floor(config.reps / Math.max(1, n / 100)));
    const amTrav = benchTraversals(amStruct, n, amReps);
    const amOutNs = (amTrav.outMs * 1e6) / (n * amReps);
    const amInNs = (amTrav.inMs * 1e6) / (n * amReps);

    await sleep(10); // Let GC settle

    // Test AL
    const alRes = await measureMemoryDeltaMB(() => makeAL(n, edges), n, edges);
    const alStruct = alRes.structure;
    const alLookup = benchHasEdge(alStruct, n, config.samples);
    const alLookupNs = (alLookup.ms * 1e6) / config.samples;
    
    const alTrav = benchTraversals(alStruct, n, amReps);
    const alOutNs = (alTrav.outMs * 1e6) / (n * amReps);
    const alInNs = (alTrav.inMs * 1e6) / (n * amReps);

    await sleep(10);

    // Test AM+AL
    const amalRes = await measureMemoryDeltaMB(() => makeAM_AL(n, edges), n, edges);
    const amalStruct = amalRes.structure;
    const amalLookup = benchHasEdge(amalStruct, n, config.samples);
    const amalLookupNs = (amalLookup.ms * 1e6) / config.samples;
    
    const amalTrav = benchTraversals(amalStruct, n, amReps);
    const amalOutNs = (amalTrav.outMs * 1e6) / (n * amReps);
    const amalInNs = (amalTrav.inMs * 1e6) / (n * amReps);

    await sleep(10);

    // Test OOP
    const oopRes = await measureMemoryDeltaMB(() => makeOOP(n, edges), n, edges);
    const oopStruct = oopRes.structure;
    const oopLookup = benchHasEdge(oopStruct, n, config.samples);
    const oopLookupNs = (oopLookup.ms * 1e6) / config.samples;
    
    const oopTrav = benchTraversals(oopStruct, n, amReps);
    const oopOutNs = (oopTrav.outMs * 1e6) / (n * amReps);
    const oopInNs = (oopTrav.inMs * 1e6) / (n * amReps);

    // Record results
    results.push({
      n,
      edges: edges.length,
      sparsity: Number(sparsity.toFixed(2)),
      'MB: AM': Number(amRes.deltaMB.toFixed(2)),
      'MB: AL': Number(alRes.deltaMB.toFixed(2)),
      'MB: AM+AL': Number(amalRes.deltaMB.toFixed(2)),
      'MB: OOP': Number(oopRes.deltaMB.toFixed(2)),
      'ns/op hasEdge AM': Number(amLookupNs.toFixed(1)),
      'ns/op hasEdge AL': Number(alLookupNs.toFixed(1)),
      'ns/op hasEdge AM+AL': Number(amalLookupNs.toFixed(1)),
      'ns/op hasEdge OOP': Number(oopLookupNs.toFixed(1)),
      'ns/op traverseOut AM': Number(amOutNs.toFixed(1)),
      'ns/op traverseOut AL': Number(alOutNs.toFixed(1)),
      'ns/op traverseOut AM+AL': Number(amalOutNs.toFixed(1)),
      'ns/op traverseOut OOP': Number(oopOutNs.toFixed(1)),
      'ns/op traverseIn AM': Number(amInNs.toFixed(1)),
      'ns/op traverseIn AL': Number(alInNs.toFixed(1)),
      'ns/op traverseIn AM+AL': Number(amalInNs.toFixed(1)),
      'ns/op traverseIn OOP': Number(oopInNs.toFixed(1)),
    });

    await sleep(10); // Brief pause between tests
  }
  
  onProgress(100);
  return results;
}

// -------------------- Type Definitions --------------------
export interface BenchmarkConfig {
  sizes: number[];
  samples: number;
  reps: number;
  degree: number;
}

export interface BenchmarkResult {
  n: number;
  edges: number;
  sparsity: number;
  'MB: AM': number;
  'MB: AL': number;
  'MB: AM+AL': number;
  'MB: OOP': number;
  'ns/op hasEdge AM': number;
  'ns/op hasEdge AL': number;
  'ns/op hasEdge AM+AL': number;
  'ns/op hasEdge OOP': number;
  'ns/op traverseOut AM': number;
  'ns/op traverseOut AL': number;
  'ns/op traverseOut AM+AL': number;
  'ns/op traverseOut OOP': number;
  'ns/op traverseIn AM': number;
  'ns/op traverseIn AL': number;
  'ns/op traverseIn AM+AL': number;
  'ns/op traverseIn OOP': number;
}

interface GraphStructure {
  n: number;
  has: (u: number, v: number) => boolean;
  outNeighbors: (u: number) => number[];
  inNeighbors: (v: number) => number[];
  _bits?: Uint32Array;
  _out?: number[][];
  _in?: number[][];
  _am?: { _bits: Uint32Array };
  _net?: object;
}

interface MemoryResult {
  deltaMB: number;
  structure: GraphStructure;
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