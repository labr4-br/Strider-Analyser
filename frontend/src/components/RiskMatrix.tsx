import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Threat } from '../schemas/stride';

interface RiskMatrixProps {
  threats: Threat[];
}

function getDotColor(severity: string) {
  switch (severity) {
    case 'Critical': return 'bg-rose-400';
    case 'High':     return 'bg-violet-400';
    case 'Medium':   return 'bg-sky-400';
    default:         return 'bg-teal-400';
  }
}

function getDotRing(severity: string) {
  switch (severity) {
    case 'Critical': return 'ring-rose-400/30';
    case 'High':     return 'ring-violet-400/30';
    case 'Medium':   return 'ring-sky-400/30';
    default:         return 'ring-teal-400/30';
  }
}

function getCellBg(score: number): string {
  if (score >= 16) return 'bg-rose-400/10 dark:bg-rose-400/15';
  if (score >= 10) return 'bg-violet-400/10 dark:bg-violet-400/12';
  if (score >= 5)  return 'bg-sky-400/8 dark:bg-sky-400/10';
  return 'bg-teal-400/6 dark:bg-teal-400/8';
}

function getCellBorder(score: number): string {
  if (score >= 16) return 'border-rose-400/20 dark:border-rose-400/25';
  if (score >= 10) return 'border-violet-400/15 dark:border-violet-400/20';
  if (score >= 5)  return 'border-sky-400/10 dark:border-sky-400/15';
  return 'border-teal-400/8 dark:border-teal-400/10';
}

function getSeverityLabel(severity: string) {
  switch (severity) {
    case 'Critical': return 'Critico';
    case 'High':     return 'Alto';
    case 'Medium':   return 'Medio';
    default:         return 'Baixo';
  }
}

interface TooltipData {
  threats: Threat[];
  x: number;
  y: number;
  score: number;
}

export function RiskMatrix({ threats }: RiskMatrixProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const cellThreats: Record<string, Threat[]> = {};
  for (const t of threats) {
    const key = `${t.likelihood}-${t.impact}`;
    if (!cellThreats[key]) cellThreats[key] = [];
    cellThreats[key].push(t);
  }

  return (
    <div className="relative">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
        Matriz de Risco
      </h3>

      <div className="flex items-end gap-1.5">
        {/* Y-axis label */}
        <div
          className="flex items-center justify-center pb-8"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest select-none">
            Impacto
          </span>
        </div>

        {/* Y-axis numbers + Grid */}
        <div className="flex flex-col gap-[3px] flex-1">
          {[5, 4, 3, 2, 1].map((impact) => (
            <div key={impact} className="flex gap-[3px] items-center">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 w-4 text-right select-none tabular-nums">
                {impact}
              </span>
              {[1, 2, 3, 4, 5].map((likelihood) => {
                const score = likelihood * impact;
                const key = `${likelihood}-${impact}`;
                const cellList = cellThreats[key] ?? [];
                const hasThreats = cellList.length > 0;

                return (
                  <div
                    key={likelihood}
                    className={`
                      relative flex-1 aspect-square min-w-[32px] max-w-[60px] rounded-md
                      border ${getCellBorder(score)} ${getCellBg(score)}
                      flex flex-wrap items-center justify-center gap-[3px] p-1
                      transition-colors duration-150
                      ${hasThreats ? 'cursor-pointer hover:brightness-110' : ''}
                    `}
                    onMouseEnter={(e) => {
                      if (!hasThreats) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        threats: cellList,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        score,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {/* Score watermark for empty cells */}
                    {!hasThreats && (
                      <span className="text-[9px] font-medium text-gray-300 dark:text-gray-700 select-none tabular-nums">
                        {score}
                      </span>
                    )}

                    {/* Threat dots */}
                    {cellList.map((t) => (
                      <div
                        key={t.id}
                        className={`
                          w-3 h-3 rounded-full ${getDotColor(t.severity)}
                          ring-2 ${getDotRing(t.severity)}
                          shadow-sm
                        `}
                      />
                    ))}

                    {/* Count badge for cells with many threats */}
                    {cellList.length > 4 && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-[8px] font-bold flex items-center justify-center shadow-sm">
                        {cellList.length}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* X-axis numbers */}
          <div className="flex gap-[3px] items-center mt-0.5">
            <span className="w-4" />
            {[1, 2, 3, 4, 5].map((l) => (
              <span
                key={l}
                className="flex-1 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 select-none tabular-nums"
              >
                {l}
              </span>
            ))}
          </div>

          {/* X-axis label */}
          <div className="text-center mt-0.5">
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest select-none">
              Probabilidade
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
        {[
          { color: 'bg-teal-400', label: 'Baixo', range: '1–4' },
          { color: 'bg-sky-400',  label: 'Medio', range: '5–9' },
          { color: 'bg-violet-400',  label: 'Alto', range: '10–15' },
          { color: 'bg-rose-400',     label: 'Critico', range: '16–25' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span className={`w-2 h-2 rounded-full ${item.color}`} />
            {item.label}
            <span className="text-gray-400 dark:text-gray-600">{item.range}</span>
          </span>
        ))}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y - 8,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900 dark:bg-gray-100 rounded-lg px-3 py-2 shadow-xl max-w-xs">
              <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1.5">
                Risco {tooltip.score}
              </div>
              <div className="space-y-1">
                {tooltip.threats.map((t) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${getDotColor(t.severity)}`} />
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono font-bold text-gray-300 dark:text-gray-600 mr-1.5">
                        {t.id}
                      </span>
                      <span className="text-[11px] text-white dark:text-gray-900">
                        {t.title}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1">
                        ({getSeverityLabel(t.severity)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-100" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
