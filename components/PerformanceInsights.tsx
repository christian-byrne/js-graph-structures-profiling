import { Lightbulb, TrendingUp, Zap, Database } from 'lucide-react';

export function PerformanceInsights() {
  const insights = [
    {
      icon: <Database className="text-blue-400" size={18} />,
      title: "Dense vs Sparse",
      content: "Use AM for dense graphs (>50% edges), AL for sparse graphs (<10% edges)"
    },
    {
      icon: <Zap className="text-yellow-400" size={18} />,
      title: "Lookup Speed",
      content: "AM provides O(1) lookups but AL with Sets achieves similar performance"
    },
    {
      icon: <TrendingUp className="text-green-400" size={18} />,
      title: "Scalability",
      content: "AL scales linearly with edges, AM scales quadratically with vertices"
    },
    {
      icon: <Lightbulb className="text-purple-400" size={18} />,
      title: "Real-world Usage",
      content: "Social networks: AL, Road networks: AM, Game engines: OOP"
    }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Lightbulb size={24} />
        Performance Insights
      </h2>
      
      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div key={i} className="p-4 bg-black/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                {insight.icon}
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1">{insight.title}</h3>
                <p className="text-blue-200 text-xs leading-relaxed">{insight.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30">
        <h3 className="text-white font-medium text-sm mb-2">💡 Pro Tip</h3>
        <p className="text-blue-200 text-xs">
          Start with small node counts (10-100) to understand performance patterns, 
          then scale up based on your specific use case.
        </p>
      </div>
    </div>
  );
}