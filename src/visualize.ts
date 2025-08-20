#!/usr/bin/env node
// visualize.ts - Simple ASCII visualization of benchmark results

import * as fs from 'fs';
import * as path from 'path';

interface BenchmarkData {
  timestamp: string;
  config: {
    SIZES: number[];
    AVG_OUT_DEG: number;
    LOOKUP_SAMPLES: number;
    TRAVERSAL_REPS: number;
  };
  results: Array<{
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
    [key: string]: string | number;
  }>;
}

function findLatestResults(): string {
  const resultsDir = './benchmark-results';
  if (!fs.existsSync(resultsDir)) {
    console.log('No benchmark results found. Run profile.js first.');
    process.exit(1);
  }
  
  const files = fs.readdirSync(resultsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();
    
  if (files.length === 0) {
    console.log('No JSON results found.');
    process.exit(1);
  }
  
  return path.join(resultsDir, files[0]);
}

function createBarChart(values: number[], labels: string[], title: string, maxWidth: number = 50): void {
  console.log(`\n${title}`);
  console.log('='.repeat(title.length));
  
  const max = Math.max(...values);
  if (max === 0) return;
  
  for (let i = 0; i < values.length; i++) {
    const normalized = (values[i] / max) * maxWidth;
    const bar = '█'.repeat(Math.round(normalized)) + '░'.repeat(Math.max(0, maxWidth - Math.round(normalized)));
    console.log(`${labels[i].padEnd(8)} |${bar}| ${values[i].toFixed(1)}`);
  }
}

function visualizeResults(filePath: string): void {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const results = data.results;
  
  console.log(`\nBENCHMARK VISUALIZATION`);
  console.log(`Results from: ${data.timestamp}`);
  console.log('='.repeat(60));
  
  // Memory usage comparison
  const memoryData = {
    AM: results.map(r => parseFloat(r['MB: AM'])),
    AL: results.map(r => parseFloat(r['MB: AL'])),
    'AM+AL': results.map(r => parseFloat(r['MB: AM+AL'])),
    OOP: results.map(r => parseFloat(r['MB: OOP']))
  };
  
  const sizes = results.map(r => r.n);
  
  console.log('\nMEMORY USAGE BY SIZE (MB):');
  console.log('='.repeat(40));
  for (const size of sizes) {
    const idx = sizes.indexOf(size);
    console.log(`\nn=${size} nodes:`);
    createBarChart(
      [memoryData.AM[idx], memoryData.AL[idx], memoryData['AM+AL'][idx], memoryData.OOP[idx]],
      ['AM', 'AL', 'AM+AL', 'OOP'],
      '',
      30
    );
  }
  
  // Lookup performance (lower is better)
  const lookupData = {
    AM: results.map(r => parseFloat(r['ns/op hasEdge AM'])),
    AL: results.map(r => parseFloat(r['ns/op hasEdge AL'])),
    'AM+AL': results.map(r => parseFloat(r['ns/op hasEdge AM+AL'])),
    OOP: results.map(r => parseFloat(r['ns/op hasEdge OOP']))
  };
  
  console.log('\n\nLOOKUP PERFORMANCE (ns/op, lower=better):');
  console.log('='.repeat(50));
  for (const size of sizes) {
    const idx = sizes.indexOf(size);
    console.log(`\nn=${size} nodes:`);
    createBarChart(
      [lookupData.AM[idx], lookupData.AL[idx], lookupData['AM+AL'][idx], lookupData.OOP[idx]],
      ['AM', 'AL', 'AM+AL', 'OOP'],
      '',
      30
    );
  }
  
  // Performance trends
  console.log('\n\nPERFORMANCE TRENDS:');
  console.log('='.repeat(40));
  
  // Memory efficiency (MB per 1000 nodes)
  console.log('\nMemory efficiency (MB per 1000 nodes):');
  for (const struct of ['AM', 'AL', 'AM+AL', 'OOP']) {
    const efficiency = results.map((r, i) => (memoryData[struct][i] / (r.n / 1000))).slice(-1)[0];
    console.log(`${struct.padEnd(6)}: ${efficiency.toFixed(2)} MB/1k nodes`);
  }
  
  // Speed comparison summary
  console.log('\nSpeed comparison (fastest to slowest lookup):');
  const avgLookup = {};
  for (const struct of ['AM', 'AL', 'AM+AL', 'OOP']) {
    avgLookup[struct] = lookupData[struct].reduce((a, b) => a + b) / lookupData[struct].length;
  }
  
  const sorted = Object.entries(avgLookup).sort(([,a], [,b]) => (a as any) - (b as any));
  for (let i = 0; i < sorted.length; i++) {
    const [name, time] = sorted[i];
    const relative = i === 0 ? '(baseline)' : `(${((time as any) / (sorted[0][1] as any)).toFixed(1)}x slower)`;
    console.log(`${(i+1)}. ${name.padEnd(6)}: ${(time as any).toFixed(1)} ns/op ${relative}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Visualization complete!');
}

// Main execution
if (require.main === module) {
  const filePath = process.argv[2] || findLatestResults();
  visualizeResults(filePath);
}

export { visualizeResults };