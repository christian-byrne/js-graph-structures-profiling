'use client';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Lightbulb } from 'lucide-react';
import { BenchmarkResult } from '@/app/page';

interface ResultsVisualizationProps {
  results: BenchmarkResult[];
}

type MetricType = 'memory' | 'lookup' | 'traversal-out' | 'traversal-in' | 'sparsity';

const COLORS = {
  'AM': '#3B82F6',     // Blue
  'AL': '#10B981',     // Green
  'AM+AL': '#8B5CF6',  // Purple
  'OOP': '#F59E0B'     // Orange
};

export function ResultsVisualization({ results }: ResultsVisualizationProps) {

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
        case 'sparsity':
          return {
            ...base,
            'Sparsity': result.sparsity
          };
      }
    });
  };


  const renderChart = (metricType: MetricType, title: string, unit: string) => {
    const chartData = getChartData(metricType);
    
    return (
      <div className="bg-white/95 backdrop-blur border border-white/20 rounded-2xl p-4 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="n" 
              label={{ value: 'Nodes', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              label={{ value: unit, angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${Number(value).toFixed(2)} ${unit}`,
                name
              ]}
              labelFormatter={(value) => `Nodes: ${value}`}
            />
            <Legend />
            
            {metricType === 'sparsity' ? (
              <Line
                key="Sparsity"
                type="monotone"
                dataKey="Sparsity"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ) : (
              Object.entries(COLORS).map(([key, color]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* All 5 charts in a responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {renderChart('memory', 'Memory Usage', 'MB')}
        {renderChart('lookup', 'Lookup Performance', 'ns/op')}
        {renderChart('traversal-out', 'Output Traversal', 'ns/op')}
        {renderChart('traversal-in', 'Input Traversal', 'ns/op')}
        {renderChart('sparsity', 'Graph Sparsity', '%')}
      </div>

      {/* Summary table */}
      <div className="bg-white/95 backdrop-blur border border-white/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Detailed Results Summary</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 text-gray-900 font-semibold">Nodes</th>
                <th className="text-left py-2 text-gray-900 font-semibold">Edges</th>
                <th className="text-left py-2 text-gray-900 font-semibold">Sparsity (%)</th>
                <th className="text-left py-2 font-semibold" style={{color: COLORS.AM}}>Memory AM (MB)</th>
                <th className="text-left py-2 font-semibold" style={{color: COLORS.AL}}>Memory AL (MB)</th>
                <th className="text-left py-2 font-semibold" style={{color: COLORS['AM+AL']}}>Memory AM+AL (MB)</th>
                <th className="text-left py-2 font-semibold" style={{color: COLORS.OOP}}>Memory OOP (MB)</th>
                <th className="text-left py-2 font-semibold" style={{color: COLORS.AM}}>Lookup AM (ns/op)</th>
                <th className="text-left py-2 font-semibold" style={{color: COLORS.AL}}>Lookup AL (ns/op)</th>
                <th className="text-left py-2 font-semibold" style={{color: COLORS['AM+AL']}}>Lookup AM+AL (ns/op)</th>
                <th className="text-left py-2 font-semibold" style={{color: COLORS.OOP}}>Lookup OOP (ns/op)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2 font-medium text-gray-900">{result.n}</td>
                  <td className="py-2 text-gray-900">{result.edges}</td>
                  <td className="py-2 text-gray-900">{result.sparsity}%</td>
                  <td className="py-2 text-gray-900">{result['MB: AM'].toFixed(3)}</td>
                  <td className="py-2 text-gray-900">{result['MB: AL'].toFixed(3)}</td>
                  <td className="py-2 text-gray-900">{result['MB: AM+AL'].toFixed(3)}</td>
                  <td className="py-2 text-gray-900">{result['MB: OOP'].toFixed(3)}</td>
                  <td className="py-2 text-gray-900">{result['ns/op hasEdge AM'].toFixed(1)}</td>
                  <td className="py-2 text-gray-900">{result['ns/op hasEdge AL'].toFixed(1)}</td>
                  <td className="py-2 text-gray-900">{result['ns/op hasEdge AM+AL'].toFixed(1)}</td>
                  <td className="py-2 text-gray-900">{result['ns/op hasEdge OOP'].toFixed(1)}</td>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-100">
          <div>
            <h4 className="font-semibold mb-2 text-yellow-300">Memory Characteristics</h4>
            <div className="space-y-2">
              <div className="p-2 bg-black/20 rounded-lg">• <strong>AM:</strong> O(n²) space, efficient for dense graphs</div>
              <div className="p-2 bg-black/20 rounded-lg">• <strong>AL:</strong> O(n + m) space, efficient for sparse graphs</div>
              <div className="p-2 bg-black/20 rounded-lg">• <strong>AM+AL:</strong> Combined approach, highest memory usage</div>
              <div className="p-2 bg-black/20 rounded-lg">• <strong>OOP:</strong> Object overhead significantly increases memory</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-yellow-300">Performance Characteristics</h4>
            <div className="space-y-2">
              <div className="p-2 bg-black/20 rounded-lg">• <strong>Lookup:</strong> AM has O(1) constant time, fastest</div>
              <div className="p-2 bg-black/20 rounded-lg">• <strong>Traversal:</strong> AL is O(degree), AM is O(n)</div>
              <div className="p-2 bg-black/20 rounded-lg">• <strong>Sparsity:</strong> &lt;1% sparse favors AL, &gt;10% dense favors AM</div>
              <div className="p-2 bg-black/20 rounded-lg">• <strong>OOP:</strong> Method call overhead impacts all operations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}