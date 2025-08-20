import { BenchmarkConfig } from '@/app/page';

interface ConfigPanelProps {
  config: BenchmarkConfig;
  onChange: (config: BenchmarkConfig) => void;
  className?: string;
}

export function ConfigPanel({ config, onChange, className = '' }: ConfigPanelProps) {
  const handleSizesChange = (value: string) => {
    const sizes = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    onChange({ ...config, sizes });
  };

  const presets = [
    { name: 'Quick Test', config: { sizes: [10, 50], samples: 1000, reps: 100, degree: 8 } },
    { name: 'Medium Test', config: { sizes: [10, 50, 200], samples: 5000, reps: 200, degree: 8 } },
    { name: 'Full Test', config: { sizes: [10, 50, 200, 500, 1000], samples: 20000, reps: 1000, degree: 8 } },
    { name: 'Stress Test', config: { sizes: [100, 500, 1000, 5000], samples: 50000, reps: 2000, degree: 10 } },
  ];

  return (
    <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-6">Benchmark Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Node Sizes (comma-separated)
            </label>
            <input
              type="text"
              value={config.sizes.join(', ')}
              onChange={(e) => handleSizesChange(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
              placeholder="10, 50, 200, 500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Lookup Samples: {config.samples.toLocaleString()}
            </label>
            <input
              type="range"
              min="100"
              max="100000"
              step="100"
              value={config.samples}
              onChange={(e) => onChange({ ...config, samples: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-blue-300">
              <span>100</span>
              <span>100K</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Traversal Reps: {config.reps.toLocaleString()}
            </label>
            <input
              type="range"
              min="10"
              max="5000"
              step="10"
              value={config.reps}
              onChange={(e) => onChange({ ...config, reps: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-blue-300">
              <span>10</span>
              <span>5K</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Average Out-Degree: {config.degree}
            </label>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={config.degree}
              onChange={(e) => onChange({ ...config, degree: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-blue-300">
              <span>2</span>
              <span>20</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-white mb-3">Quick Presets</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange({ ...config, ...preset.config })}
              className="px-4 py-2 text-sm border border-white/30 rounded-lg text-white hover:bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-black/20"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-xl">
        <div className="text-sm text-white font-medium">
          <strong>Estimated operations:</strong> {(
            config.sizes.reduce((sum, n) => 
              sum + (config.samples * 4) + (config.reps * n * 2 * 4), 0
            )
          ).toLocaleString()}
        </div>
        <div className="text-xs text-blue-200 mt-1">
          Higher values = more accurate but slower results
        </div>
      </div>
    </div>
  );
}