import { useEffect } from 'react';
import { BenchmarkConfig, BenchmarkResult } from '@/app/page';
import { runRealBenchmark } from '@/lib/benchmark';

interface BenchmarkRunnerProps {
  config: BenchmarkConfig;
  onProgress: (progress: number) => void;
  onComplete: (results: BenchmarkResult[]) => void;
  progress: number;
}

export function BenchmarkRunner({ config, onProgress, onComplete, progress }: BenchmarkRunnerProps) {
  useEffect(() => {
    // Run the actual benchmark logic
    runRealBenchmark(config, onProgress).then(onComplete);
  }, [config, onProgress, onComplete]);

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Running Performance Analysis...</h3>
        <div className="text-lg font-bold text-blue-300">{Math.round(progress)}%</div>
      </div>
      
      <div className="w-full bg-black/20 rounded-full h-4 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-300 shadow-lg"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="text-blue-200 flex items-center justify-between">
        <span>Testing {config.sizes.length} node configurations...</span>
        <span>{config.samples.toLocaleString()} samples per test</span>
      </div>
    </div>
  );
}
