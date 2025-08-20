'use client';

import { useState, useCallback } from 'react';
import { Play, Settings, BarChart3, Download } from 'lucide-react';
import { BenchmarkRunner } from '@/components/BenchmarkRunner';
import { ResultsVisualization } from '@/components/ResultsVisualization';
import { ConfigPanel } from '@/components/ConfigPanel';

export interface BenchmarkConfig {
  sizes: number[];
  samples: number;
  reps: number;
  degree: number;
}

export interface BenchmarkResult {
  n: number;
  edges: number;
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
      const benchmarkResults = await runBenchmark(config, (p) => setProgress(p));
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Graph Data Structure Benchmarks
          </h1>
          <p className="text-slate-600 text-lg">
            Compare performance of Adjacency Matrix, Adjacency List, Combined, and OOP approaches
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play size={20} />
                    {isRunning ? 'Running...' : 'Run Benchmark'}
                  </button>
                  
                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    <Settings size={20} />
                    Configure
                  </button>
                  
                  {results.length > 0 && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      <Download size={20} />
                      Download
                    </button>
                  )}
                </div>
                
                <div className="text-sm text-slate-600">
                  Est. operations: {totalOps.toLocaleString()}
                </div>
              </div>

              {showConfig && (
                <ConfigPanel
                  config={config}
                  onChange={setConfig}
                  className="mb-6"
                />
              )}

              {isRunning && (
                <BenchmarkRunner
                  config={config}
                  onProgress={setProgress}
                  onComplete={setResults}
                  progress={progress}
                />
              )}

              {results.length > 0 && (
                <ResultsVisualization results={results} />
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={24} />
              Test Configuration
            </h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-slate-700">Node counts:</span>
                <div className="text-slate-600">{config.sizes.join(', ')}</div>
              </div>
              
              <div>
                <span className="font-medium text-slate-700">Lookup samples:</span>
                <div className="text-slate-600">{config.samples.toLocaleString()}</div>
              </div>
              
              <div>
                <span className="font-medium text-slate-700">Traversal reps:</span>
                <div className="text-slate-600">{config.reps.toLocaleString()}</div>
              </div>
              
              <div>
                <span className="font-medium text-slate-700">Avg out-degree:</span>
                <div className="text-slate-600">{config.degree}</div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-700 mb-2">Data Structures</h3>
              <div className="space-y-1 text-xs text-slate-600">
                <div><span className="font-medium text-blue-600">AM:</span> Adjacency Matrix (bitset)</div>
                <div><span className="font-medium text-green-600">AL:</span> Adjacency List + Sets</div>
                <div><span className="font-medium text-purple-600">AM+AL:</span> Combined approach</div>
                <div><span className="font-medium text-orange-600">OOP:</span> Object-oriented (LiteGraph-style)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Mock benchmark function - replace with actual implementation
async function runBenchmark(
  config: BenchmarkConfig, 
  onProgress: (progress: number) => void
): Promise<BenchmarkResult[]> {
  // This will be replaced with actual benchmark logic
  const results: BenchmarkResult[] = [];
  
  for (let i = 0; i < config.sizes.length; i++) {
    onProgress((i / config.sizes.length) * 100);
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const n = config.sizes[i];
    results.push({
      n,
      edges: n * config.degree,
      'MB: AM': Math.random() * 10,
      'MB: AL': Math.random() * 5,
      'MB: AM+AL': Math.random() * 12,
      'MB: OOP': Math.random() * 8,
      'ns/op hasEdge AM': Math.random() * 100,
      'ns/op hasEdge AL': Math.random() * 50,
      'ns/op hasEdge AM+AL': Math.random() * 75,
      'ns/op hasEdge OOP': Math.random() * 150,
      'ns/op traverseOut AM': Math.random() * 200,
      'ns/op traverseOut AL': Math.random() * 100,
      'ns/op traverseOut AM+AL': Math.random() * 150,
      'ns/op traverseOut OOP': Math.random() * 300,
      'ns/op traverseIn AM': Math.random() * 200,
      'ns/op traverseIn AL': Math.random() * 100,
      'ns/op traverseIn AM+AL': Math.random() * 150,
      'ns/op traverseIn OOP': Math.random() * 300,
    });
  }
  
  onProgress(100);
  return results;
}