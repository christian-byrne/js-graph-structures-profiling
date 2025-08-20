import { Code, CheckCircle, XCircle } from 'lucide-react';

interface AlgorithmCardProps {
  title: string;
  color: string;
  complexity: {
    space: string;
    lookup: string;
    traversal: string;
  };
  description: string;
  pros: string[];
  cons: string[];
  code: string;
}

export function AlgorithmCard({ title, color, complexity, description, pros, cons, code }: AlgorithmCardProps) {
  return (
    <div className="bg-white/95 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold mb-4 ${color}`}>
        <Code size={18} />
        {title}
      </div>
      
      <p className="text-gray-700 mb-4 text-sm leading-relaxed">
        {description}
      </p>
      
      {/* Complexity */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 font-medium">SPACE</div>
          <div className="font-mono font-bold text-gray-800">{complexity.space}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 font-medium">LOOKUP</div>
          <div className="font-mono font-bold text-gray-800">{complexity.lookup}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 font-medium">TRAVERSAL</div>
          <div className="font-mono font-bold text-gray-800">{complexity.traversal}</div>
        </div>
      </div>
      
      {/* Pros & Cons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
            <CheckCircle size={14} />
            Advantages
          </h4>
          <ul className="space-y-1">
            {pros.map((pro, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-green-500 mt-0.5">•</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
            <XCircle size={14} />
            Limitations
          </h4>
          <ul className="space-y-1">
            {cons.map((con, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-red-500 mt-0.5">•</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Code Sample */}
      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
        <pre className="text-xs text-gray-300 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}