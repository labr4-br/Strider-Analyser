import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, TrendingUp, LayoutGrid } from 'lucide-react';
import { StrideAnalysis, Threat } from '../schemas/stride';
import { StrideCard } from './StrideCard';
import { RiskMatrix } from './RiskMatrix';
import { MarkdownText } from './MarkdownText';
import { SectionDivider } from './SectionDivider';

interface StrideGridProps {
  analysis: Partial<StrideAnalysis>;
}

const SEVERITY_DOT: Record<string, string> = {
  Critical: 'bg-rose-400',
  High: 'bg-violet-400',
  Medium: 'bg-sky-400',
  Low: 'bg-teal-400',
};

function getRiskColor(score: number) {
  if (score >= 16) return 'text-rose-500';
  if (score >= 10) return 'text-violet-500';
  if (score >= 5) return 'text-sky-500';
  return 'text-teal-500';
}

export function StrideGrid({ analysis }: StrideGridProps) {
  const categories = analysis.categories ?? [];

  const allThreats: Threat[] = categories
    .flatMap((cat) => cat.threats ?? [])
    .filter((t): t is Threat =>
      typeof t.likelihood === 'number' && typeof t.impact === 'number'
    );

  const criticalCount = analysis.criticalCount ?? allThreats.filter(t => t.severity === 'Critical').length;
  const highCount = analysis.highCount ?? allThreats.filter(t => t.severity === 'High').length;
  const mediumCount = allThreats.filter(t => t.severity === 'Medium').length;
  const lowCount = allThreats.filter(t => t.severity === 'Low').length;

  // Top threats by risk score
  const topThreats = [...allThreats]
    .sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact))
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Section 1 Header */}
      <SectionDivider number={1} />
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Modelo de Ameaças
        </h2>
        {allThreats.length > 0 && (
          <span className="text-[11px] text-gray-400 dark:text-gray-600 tabular-nums">
            {allThreats.length} ameaças identificadas
          </span>
        )}
      </div>

      {/* Side-by-side: Matrix left | Summary right */}
      {allThreats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left — Risk Matrix */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <RiskMatrix threats={allThreats} />
          </div>

          {/* Right — Explanation & Summary */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 overflow-y-auto">
            {/* Severity counts */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Distribuição por Severidade
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Críticas', count: criticalCount, color: 'bg-rose-400', textColor: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Altas', count: highCount, color: 'bg-violet-400', textColor: 'text-violet-600 dark:text-violet-400' },
                  { label: 'Médias', count: mediumCount, color: 'bg-sky-400', textColor: 'text-sky-600 dark:text-sky-400' },
                  { label: 'Baixas', count: lowCount, color: 'bg-teal-400', textColor: 'text-teal-600 dark:text-teal-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className={`ml-auto text-sm font-bold ${item.textColor}`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top threats */}
            {topThreats.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Maiores Riscos
                </h3>
                <div className="space-y-1.5">
                  {topThreats.map((t) => {
                    const score = t.likelihood * t.impact;
                    return (
                      <div key={t.id} className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_DOT[t.severity] ?? 'bg-gray-400'}`} />
                        <span className="font-mono font-bold text-gray-400 dark:text-gray-500 w-5 shrink-0">{t.id}</span>
                        <span className="text-gray-600 dark:text-gray-300 flex-1 min-w-0 truncate">{t.title}</span>
                        <span className={`font-bold tabular-nums shrink-0 ${getRiskColor(score)}`}>
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Overview summary */}
            {analysis.overviewSummary && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Resumo Executivo
                </h3>
                <MarkdownText text={analysis.overviewSummary} className="text-gray-600 dark:text-gray-400" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 2 Header */}
      <SectionDivider number={2} />
      <div className="flex items-center gap-3">
        <LayoutGrid className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Categorias STRIDE
        </h2>
        <span className="text-[11px] text-gray-400 dark:text-gray-600 tabular-nums">
          {categories.length} categorias
        </span>
      </div>

      {/* Cards grid — full width below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <StrideCard key={cat.key ?? i} category={cat} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
