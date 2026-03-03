import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { StrideAnalysis } from '../schemas/stride';

interface StreamingOutputProps {
  analysis: Partial<StrideAnalysis> | null;
  isStreaming: boolean;
}

export function StreamingOutput({ analysis, isStreaming }: StreamingOutputProps) {
  const categories = analysis?.categories ?? [];
  const totalThreats = categories.reduce((sum, cat) => sum + (cat.threats?.length ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <FileText className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Resultado da Análise
        </span>
        {isStreaming && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Transmitindo
          </span>
        )}
        {!isStreaming && analysis && (
          <span className="ml-auto text-xs text-green-400">Concluído</span>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4 bg-gray-900 dark:bg-gray-950 h-80 lg:h-[420px] overflow-y-auto scrollbar-thin">
        {/* Overview summary */}
        {analysis?.overviewSummary && (
          <p className="text-xs text-gray-300 leading-relaxed mb-4">
            {analysis.overviewSummary}
            {isStreaming && !categories.length && (
              <span className="ml-1 inline-block w-1.5 h-3 bg-gray-300 animate-pulse rounded-sm" />
            )}
          </p>
        )}

        {/* Progress indicator */}
        {isStreaming && (
          <p className="text-xs text-indigo-400 mb-3">
            Analisando... {totalThreats > 0 ? `${totalThreats} ameaça${totalThreats !== 1 ? 's' : ''} identificada${totalThreats !== 1 ? 's' : ''}` : ''}
          </p>
        )}

        {/* Categories arriving */}
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                <span className="font-mono font-bold text-indigo-400">{cat.key}</span>
                {cat.fullName ? ` — ${cat.fullName}` : ''}
              </span>
              {cat.threats !== undefined && (
                <span className="text-gray-500">
                  {cat.threats.length} ameaça{cat.threats.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Streaming cursor */}
        {isStreaming && categories.length > 0 && (
          <span className="inline-block w-1.5 h-3 bg-indigo-400 animate-pulse rounded-sm mt-2" />
        )}
      </div>
    </motion.div>
  );
}
