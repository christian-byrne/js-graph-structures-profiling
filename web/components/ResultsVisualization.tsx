'use client';

import { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Lightbulb } from 'lucide-react';
import { BenchmarkResult } from '@/app/page';

interface ResultsVisualizationProps {
  results: BenchmarkResult[];
}

type MetricType = 'memory' | 'lookup' | 'traversal-out' | 'traversal-in';

const COLORS = {
  'AM': '#3B82F6',     // Blue
  'AL': '#10B981',     // Green
  'AM+AL': '#8B5CF6',  // Purple
  'OOP': '#F59E0B'     // Orange
};

export function ResultsVisualization({ results }: ResultsVisualizationProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>('memory');

  const getChartData = (metricType: MetricType) => {
    return results.map(result => {
      const base = { n: result.n, edges: result.edges };
      
      switch (metricType) {
        case 'memory':
          return {
            ...base,
            'AM': result['MB: AM'],
            'AL': result['MB: AL'],
            'AM+AL': result['MB: AM+AL'],
            'OOP': result['MB: OOP']
          };
        case 'lookup':
          return {
            ...base,
            'AM': result['ns/op hasEdge AM'],
            'AL': result['ns/op hasEdge AL'],
            'AM+AL': result['ns/op hasEdge AM+AL'],
            'OOP': result['ns/op hasEdge OOP']
          };
        case 'traversal-out':
          return {
            ...base,
            'AM': result['ns/op traverseOut AM'],
            'AL': result['ns/op traverseOut AL'],
            'AM+AL': result['ns/op traverseOut AM+AL'],
            'OOP': result['ns/op traverseOut OOP']
          };
        case 'traversal-in':
          return {
            ...base,
            'AM': result['ns/op traverseIn AM'],
            'AL': result['ns/op traverseIn AL'],
            'AM+AL': result['ns/op traverseIn AM+AL'],
            'OOP': result['ns/op traverseIn OOP']
          };
      }
    });
  };

  const getMetricUnit = (metricType: MetricType) => {
    switch (metricType) {
      case 'memory': return 'MB';
      default: return 'ns/op';
    }
  };

  const getMetricTitle = (metricType: MetricType) => {
    switch (metricType) {
      case 'memory': return 'Memory Usage';
      case 'lookup': return 'Lookup Performance (hasEdge)';
      case 'traversal-out': return 'Output Traversal Performance';
      case 'traversal-in': return 'Input Traversal Performance';
    }
  };

  const chartData = getChartData(activeMetric);
  const unit = getMetricUnit(activeMetric);
  const title = getMetricTitle(activeMetric);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'memory' as MetricType, label: 'Memory Usage' },
          { key: 'lookup' as MetricType, label: 'Lookup Speed' },
          { key: 'traversal-out' as MetricType, label: 'Output Traversal' },
          { key: 'traversal-in' as MetricType, label: 'Input Traversal' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeMetric === key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white/95 backdrop-blur border border-white/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6">{title} by Node Count</h3>
        
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="n" 
              label={{ value: 'Node Count', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: unit, angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${Number(value).toFixed(2)} ${unit}`,
                name
              ]}
              labelFormatter={(value) => `Nodes: ${value}`}
            />
            <Legend />
            
            {Object.entries(COLORS).map(([key, color]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance comparison bar chart */}
      <div className="bg-white/95 backdrop-blur border border-white/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Comparison</h3>
        
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="n" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${Number(value).toFixed(2)} ${unit}`,
                name
              ]}
            />
            <Legend />
            
            {Object.entries(COLORS).map(([key, color]) => (
              <Bar key={key} dataKey={key} fill={color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="bg-white/95 backdrop-blur border border-white/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Detailed Results Summary</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nodes</th>
                <th className="text-left py-2">Edges</th>
                <th className="text-left py-2" style={{color: COLORS.AM}}>AM</th>
                <th className="text-left py-2" style={{color: COLORS.AL}}>AL</th>
                <th className="text-left py-2" style={{color: COLORS['AM+AL']}}>AM+AL</th>
                <th className="text-left py-2" style={{color: COLORS.OOP}}>OOP</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 font-medium">{row.n}</td>
                  <td className="py-2">{row.edges}</td>
                  <td className="py-2">{Number(row.AM).toFixed(2)} {unit}</td>
                  <td className="py-2">{Number(row.AL).toFixed(2)} {unit}</td>
                  <td className="py-2">{Number(row['AM+AL']).toFixed(2)} {unit}</td>
                  <td className="py-2">{Number(row.OOP).toFixed(2)} {unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis insights */}
      <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur border border-blue-400/30 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
          <Lightbulb size={24} className="text-yellow-400" />
          Algorithm Analysis
        </h3>
        <div className="space-y-3 text-sm text-blue-100">
          {activeMetric === 'memory' && (
            <>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>AM (Adjacency Matrix):</strong> Memory grows O(n²), efficient for dense graphs</div>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>AL (Adjacency List):</strong> Memory grows O(n + m), efficient for sparse graphs</div>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>AM+AL:</strong> Combined approach uses most memory but offers flexibility</div>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>OOP:</strong> Object overhead increases memory usage significantly</div>
            </>
          )}
          {activeMetric === 'lookup' && (
            <>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>AM:</strong> O(1) constant time lookups, very fast</div>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>AL:</strong> O(1) average with Sets, good performance</div>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>OOP:</strong> Slower due to method calls and object traversal</div>
            </>
          )}
          {(activeMetric === 'traversal-out' || activeMetric === 'traversal-in') && (
            <>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>AM:</strong> O(n) traversal time, gets slower with larger graphs</div>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>AL:</strong> O(degree) traversal time, scales with connectivity</div>
              <div className="p-3 bg-black/20 rounded-lg">• <strong>OOP:</strong> Additional overhead from object method calls</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}