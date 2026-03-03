import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, ChevronDown } from 'lucide-react';
import { StrideAnalysis } from '../schemas/stride';

interface StreamingOutputProps {
  analysis: Partial<StrideAnalysis> | null;
  isStreaming: boolean;
}

function AccordionPanel({
  title,
  icon: Icon,
  badge,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
      >
        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</span>
        {badge && <span className="ml-auto mr-2">{badge}</span>}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StreamingOutput({ analysis, isStreaming }: StreamingOutputProps) {
  const [openPanel, setOpenPanel] = useState<'arch' | 'analysis'>('analysis');

  const categories = analysis?.categories ?? [];
  const totalThreats = categories.reduce((sum, cat) => sum + (cat.threats?.length ?? 0), 0);
  const hasArchDescription = !!analysis?.architectureDescription;
  const isStreamingArch = isStreaming && !analysis?.overviewSummary;

  const statusBadge = isStreaming ? (
    <span className="flex items-center gap-1.5 text-xs text-indigo-400">
      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
      Transmitindo
    </span>
  ) : analysis ? (
    <span className="text-xs text-green-400">Concluído</span>
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      <AccordionPanel
        title="Entendimento da Arquitetura"
        icon={Eye}
        badge={isStreamingArch ? (
          <span className="flex items-center gap-1.5 text-xs text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Analisando
          </span>
        ) : hasArchDescription ? (
          <span className="text-xs text-green-400">Concluído</span>
        ) : null}
        open={openPanel === 'arch'}
        onToggle={() => setOpenPanel(openPanel === 'arch' ? 'analysis' : 'arch')}
      >
        <div className="px-5 py-4 bg-gray-900 dark:bg-gray-950 max-h-64 overflow-y-auto scrollbar-thin">
          {hasArchDescription ? (
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
              {analysis.architectureDescription}
            </p>
          ) : isStreamingArch ? (
            <span className="inline-block w-1.5 h-3 bg-indigo-400 animate-pulse rounded-sm" />
          ) : (
            <p className="text-xs text-gray-500">Aguardando análise...</p>
          )}
        </div>
      </AccordionPanel>

      <AccordionPanel
        title="Resultado da Análise"
        icon={FileText}
        badge={statusBadge}
        open={openPanel === 'analysis'}
        onToggle={() => setOpenPanel(openPanel === 'analysis' ? 'arch' : 'analysis')}
      >
        <div className="px-5 py-4 bg-gray-900 dark:bg-gray-950 h-80 lg:h-[420px] overflow-y-auto scrollbar-thin">
          {analysis?.overviewSummary && (
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              {analysis.overviewSummary}
              {isStreaming && !categories.length && (
                <span className="ml-1 inline-block w-1.5 h-3 bg-gray-300 animate-pulse rounded-sm" />
              )}
            </p>
          )}

          {isStreaming && (
            <p className="text-xs text-indigo-400 mb-3">
              Analisando... {totalThreats > 0 ? `${totalThreats} ameaça${totalThreats !== 1 ? 's' : ''} identificada${totalThreats !== 1 ? 's' : ''}` : ''}
            </p>
          )}

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

          {isStreaming && categories.length > 0 && (
            <span className="inline-block w-1.5 h-3 bg-indigo-400 animate-pulse rounded-sm mt-2" />
          )}
        </div>
      </AccordionPanel>
    </motion.div>
  );
}
