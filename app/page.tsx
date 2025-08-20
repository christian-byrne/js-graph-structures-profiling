'use client';

import { useState, useCallback } from 'react';
import { Play, Settings, Download } from 'lucide-react';
import { BenchmarkRunner } from '@/components/BenchmarkRunner';
import { ResultsVisualization } from '@/components/ResultsVisualization';
import { ConfigPanel } from '@/components/ConfigPanel';
import { AlgorithmCard } from '@/components/AlgorithmCard';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import { PerformanceInsights } from '@/components/PerformanceInsights';
import { ComplexityReference } from '@/components/ComplexityReference';
import { runRealBenchmark } from '@/lib/benchmark';

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

const defaultConfig: BenchmarkConfig = {
  sizes: [10, 50, 200],
  samples: 5000,
  reps: 200,
  degree: 8
};

export default function Home() {
  const [config, setConfig] = useState<BenchmarkConfig>(defaultConfig);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    
    try {
      const benchmarkResults = await runRealBenchmark(config, (p) => setProgress(p));
      setResults(benchmarkResults);
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  }, [config]);

  const handleDownload = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      config,
      results
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph-benchmark-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [config, results]);

  const totalOps = config.sizes.reduce((sum, n) => 
    sum + (config.samples * 4) + (config.reps * n * 2 * 4), 0
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="w-full px-6 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Graph Data Structure Performance Analysis
          </h1>
          <p className="text-blue-200 text-xl max-w-4xl mx-auto">
            Interactive benchmarking suite comparing Adjacency Matrix, Adjacency List, Combined, 
            Object-Oriented, and advanced graph representations
          </p>
        </header>

        {/* Controls Row */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                >
                  <Play size={24} />
                  {isRunning ? 'Running Benchmark...' : 'Run Performance Test'}
                </button>
                
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center gap-2 px-6 py-4 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 border border-white/30"
                >
                  <Settings size={20} />
                  {showConfig ? 'Hide Config' : 'Configure'}
                </button>
                
                {results.length > 0 && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700"
                  >
                    <Download size={20} />
                    Export Results
                  </button>
                )}
              </div>
              
              <div className="bg-black/20 backdrop-blur px-4 py-2 rounded-lg">
                <span className="text-blue-200 text-sm font-medium">
                  Estimated Operations: </span>
                <span className="text-white font-bold">{totalOps.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {showConfig && (
          <div className="max-w-7xl mx-auto mb-8">
            <ConfigPanel
              config={config}
              onChange={setConfig}
            />
          </div>
        )}

        {isRunning && (
          <div className="max-w-7xl mx-auto mb-8">
            <BenchmarkRunner
              config={config}
              onProgress={setProgress}
              onComplete={setResults}
              progress={progress}
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Results Area */}
          <div className="xl:col-span-3 space-y-8">
            {results.length > 0 && (
              <ResultsVisualization results={results} />
            )}
            
            {/* Algorithm Explanations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AlgorithmCard
                title="Adjacency Matrix (AM)"
                color="bg-blue-600"
                complexity={{
                  space: "O(V²)",
                  lookup: "O(1)",
                  traversal: "O(V)"
                }}
                description="Compact bitset representation using Uint32Array. Each edge stored as a single bit."
                pros={["Constant-time edge queries", "Cache-friendly for dense graphs", "Memory-efficient bit packing"]}
                cons={["Quadratic memory usage", "Slow vertex traversal", "Poor for sparse graphs"]}
                code={`const bits = new Uint32Array(Math.ceil((n * n) / 32));
const hasEdge = (u, v) => {
  const idx = u * n + v;
  return (bits[idx >>> 5] >>> (idx & 31)) & 1;
};`}
              />
              
              <AlgorithmCard
                title="Adjacency List (AL)"
                color="bg-green-600"
                complexity={{
                  space: "O(V + E)",
                  lookup: "O(1) avg",
                  traversal: "O(degree)"
                }}
                description="Array of neighbor lists with Set-based fast lookups. Optimal for sparse graphs."
                pros={["Linear memory usage", "Fast neighbor iteration", "Scales with edges"]}
                cons={["Hash set overhead", "Variable lookup time", "Memory fragmentation"]}
                code={`const adjList = Array(n).fill(null).map(() => []);
const adjSets = adjList.map(list => new Set(list));
const hasEdge = (u, v) => adjSets[u].has(v);`}
              />
              
              <AlgorithmCard
                title="Combined (AM+AL)"
                color="bg-purple-600"
                complexity={{
                  space: "O(V² + E)",
                  lookup: "O(1)",
                  traversal: "O(degree)"
                }}
                description="Hybrid approach maintaining both representations for optimal access patterns."
                pros={["Best of both worlds", "Flexible queries", "Optimized operations"]}
                cons={["Highest memory usage", "Update complexity", "Implementation overhead"]}
                code={`const matrix = new AdjacencyMatrix(n);
const list = new AdjacencyList(n);
// Maintain both structures
const addEdge = (u, v) => {
  matrix.addEdge(u, v);
  list.addEdge(u, v);
};`}
              />
              
              <AlgorithmCard
                title="Object-Oriented (OOP)"
                color="bg-orange-600"
                complexity={{
                  space: "O(V + E)",
                  lookup: "O(degree)",
                  traversal: "O(degree)"
                }}
                description="Node and Link objects with method-based interface. Similar to LiteGraph architecture."
                pros={["Intuitive API", "Extensible design", "Rich metadata support"]}
                cons={["Method call overhead", "Object allocation cost", "Memory fragmentation"]}
                code={`class Node {
  constructor(id) {
    this.id = id;
    this.outputs = [];
    this.inputs = [];
  }
}
const hasEdge = (u, v) => 
  nodes[u].outputs.some(link => link.to === v);`}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ConfigurationPanel config={config} />
            <PerformanceInsights />
            <ComplexityReference />
          </div>
        </div>
      </div>
    </main>
  );
}