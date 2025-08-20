import { BookOpen, Clock, HardDrive, Search } from 'lucide-react';

export function ComplexityReference() {
  const complexities = [
    {
      operation: "Space Complexity",
      icon: <HardDrive className="text-indigo-400" size={16} />,
      am: "O(V²)",
      al: "O(V + E)",
      combined: "O(V² + E)",
      oop: "O(V + E + overhead)"
    },
    {
      operation: "Edge Lookup",
      icon: <Search className="text-green-400" size={16} />,
      am: "O(1)",
      al: "O(1) avg",
      combined: "O(1)",
      oop: "O(degree)"
    },
    {
      operation: "Add Edge",
      icon: <Clock className="text-blue-400" size={16} />,
      am: "O(1)",
      al: "O(1) avg",
      combined: "O(1)",
      oop: "O(1)"
    },
    {
      operation: "Get Neighbors",
      icon: <Clock className="text-orange-400" size={16} />,
      am: "O(V)",
      al: "O(degree)",
      combined: "O(degree)",
      oop: "O(degree)"
    },
    {
      operation: "Remove Vertex",
      icon: <Clock className="text-red-400" size={16} />,
      am: "O(V²)",
      al: "O(V + E)",
      combined: "O(V²)",
      oop: "O(V + E)"
    }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <BookOpen size={24} />
        Complexity Reference
      </h2>
      
      <div className="space-y-3">
        {complexities.map((item, i) => (
          <div key={i} className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {item.icon}
              <span className="text-white font-medium text-sm">{item.operation}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-300">AM:</span>
                <code className="text-blue-200 font-mono">{item.am}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-green-300">AL:</span>
                <code className="text-green-200 font-mono">{item.al}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">AM+AL:</span>
                <code className="text-purple-200 font-mono">{item.combined}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-300">OOP:</span>
                <code className="text-orange-200 font-mono">{item.oop}</code>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-400/30">
        <p className="text-indigo-200 text-xs">
          <span className="font-medium">V</span> = number of vertices, 
          <span className="font-medium"> E</span> = number of edges,
          <span className="font-medium"> degree</span> = avg edges per vertex
        </p>
      </div>
    </div>
  );
}