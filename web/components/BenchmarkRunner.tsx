import { useEffect } from 'react';
import { BenchmarkConfig, BenchmarkResult } from '@/app/page';

interface BenchmarkRunnerProps {
  config: BenchmarkConfig;
  onProgress: (progress: number) => void;
  onComplete: (results: BenchmarkResult[]) => void;
  progress: number;
}

export function BenchmarkRunner({ config, onProgress, onComplete, progress }: BenchmarkRunnerProps) {
  useEffect(() => {
    // Import and run the actual benchmark logic here
    // For now, we'll use a mock implementation
    runBenchmark(config, onProgress).then(onComplete);
  }, [config, onProgress, onComplete]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Running Benchmark...</h3>
        <div className="text-sm text-slate-600">{Math.round(progress)}%</div>
      </div>
      
      <div className="w-full bg-slate-200 rounded-full h-3">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="text-sm text-slate-600">
        Testing {config.sizes.length} different node counts with {config.samples.toLocaleString()} lookup samples each...
      </div>
    </div>
  );
}

// This will be replaced with the actual benchmark implementation
async function runBenchmark(
  config: BenchmarkConfig,
  onProgress: (progress: number) => void
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  for (let i = 0; i < config.sizes.length; i++) {
    onProgress((i / config.sizes.length) * 100);
    
    // Simulate realistic benchmark timing
    await new Promise(resolve => setTimeout(resolve, Math.max(500, config.sizes[i] * 2)));
    
    const n = config.sizes[i];
    
    // Generate more realistic mock data
    const amMemory = (n * n) / (8 * 1024 * 1024); // Bitset memory
    const alMemory = (n * config.degree * 8) / (1024 * 1024); // Approx AL memory
    
    results.push({
      n,
      edges: n * config.degree,
      'MB: AM': Number(amMemory.toFixed(2)),
      'MB: AL': Number(alMemory.toFixed(2)),
      'MB: AM+AL': Number((amMemory + alMemory).toFixed(2)),
      'MB: OOP': Number((alMemory * 3).toFixed(2)),
      
      // Lookup performance (ns/op) - AM should be fast, OOP slower
      'ns/op hasEdge AM': Math.random() * 20 + 5,
      'ns/op hasEdge AL': Math.random() * 15 + 5,
      'ns/op hasEdge AM+AL': Math.random() * 25 + 5,
      'ns/op hasEdge OOP': Math.random() * 100 + 50,
      
      // Traversal performance - AM should be slower for large graphs
      'ns/op traverseOut AM': Math.random() * n * 0.1 + 50,
      'ns/op traverseOut AL': Math.random() * 20 + 10,
      'ns/op traverseOut AM+AL': Math.random() * 30 + 15,
      'ns/op traverseOut OOP': Math.random() * 50 + 25,
      
      'ns/op traverseIn AM': Math.random() * n * 0.1 + 50,
      'ns/op traverseIn AL': Math.random() * 20 + 10,
      'ns/op traverseIn AM+AL': Math.random() * 30 + 15,
      'ns/op traverseIn OOP': Math.random() * 50 + 25,
    });
  }
  
  onProgress(100);
  return results;
}