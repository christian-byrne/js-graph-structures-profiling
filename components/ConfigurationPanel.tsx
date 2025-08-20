import { BenchmarkConfig } from '@/app/page';
import { Settings, Cpu, HardDrive, Timer, Network } from 'lucide-react';

interface ConfigurationPanelProps {
  config: BenchmarkConfig;
}

export function ConfigurationPanel({ config }: ConfigurationPanelProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Settings size={24} />
        Current Configuration
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Network size={16} className="text-blue-300" />
          </div>
          <div>
            <div className="text-blue-200 text-sm font-medium">Node Counts</div>
            <div className="text-white font-semibold">{config.sizes.join(', ')}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Timer size={16} className="text-green-300" />
          </div>
          <div>
            <div className="text-blue-200 text-sm font-medium">Lookup Samples</div>
            <div className="text-white font-semibold">{config.samples.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Cpu size={16} className="text-purple-300" />
          </div>
          <div>
            <div className="text-blue-200 text-sm font-medium">Traversal Reps</div>
            <div className="text-white font-semibold">{config.reps.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <HardDrive size={16} className="text-orange-300" />
          </div>
          <div>
            <div className="text-blue-200 text-sm font-medium">Average Out-Degree</div>
            <div className="text-white font-semibold">{config.degree}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-black/20 rounded-lg">
        <h3 className="text-white font-medium mb-3">Data Structures</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-blue-200">AM: Adjacency Matrix</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-green-200">AL: Adjacency List</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-purple-200">AM+AL: Combined</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-orange-200">OOP: Object-Oriented</span>
          </div>
        </div>
      </div>
    </div>
  );
}