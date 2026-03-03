import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, TrendingUp } from 'lucide-react';
import { StrideAnalysis, Threat } from '../schemas/stride';
import { StrideCard } from './StrideCard';
import { RiskMatrix } from './RiskMatrix';
import { MarkdownText } from './MarkdownText';

interface StrideGridProps {
  analysis: Partial<StrideAnalysis>;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'Critical': return 'text-red-500';
    case 'High': return 'text-orange-500';
    case 'Medium': return 'text-yellow-500';
    default: return 'text-green-500';
  }
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
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Modelo de Ameaças
        </h2>
      </div>

      {/* Side-by-side: Matrix left | Summary right */}
      {allThreats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left — Risk Matrix */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <RiskMatrix threats={allThreats} />
          </div>

          {/* Right — Explanation & Summary */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
            {/* Severity counts */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Distribuição por Severidade
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Críticas', count: criticalCount, color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
                  { label: 'Altas', count: highCount, color: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400' },
                  { label: 'Médias', count: mediumCount, color: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400' },
                  { label: 'Baixas', count: lowCount, color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
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
                  {topThreats.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-gray-400 w-5 shrink-0">{t.id}</span>
                      <span className={`font-bold shrink-0 ${getSeverityColor(t.severity)}`}>
                        {t.likelihood}×{t.impact}={t.likelihood * t.impact}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 truncate">{t.title}</span>
                    </div>
                  ))}
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

      {/* Cards grid — full width below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <StrideCard key={cat.key ?? i} category={cat} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
