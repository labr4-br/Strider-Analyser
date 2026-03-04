import { motion } from 'framer-motion';
import clsx from 'clsx';
import { StrideCategoryData } from '../schemas/stride';
import { STRIDE_CATEGORIES } from '../types/stride';
import { ThreatItem } from './ThreatItem';

interface StrideCardProps {
  category: Partial<StrideCategoryData>;
  index: number;
}

const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low'] as const;

const SEVERITY_BAR_COLOR: Record<string, string> = {
  Critical: 'bg-rose-400',
  High: 'bg-violet-400',
  Medium: 'bg-sky-400',
  Low: 'bg-teal-400',
};

export function StrideCard({ category, index }: StrideCardProps) {
  const meta = STRIDE_CATEGORIES.find((c) => c.key === category.key);
  const threats = category.threats ?? [];

  // Severity distribution for the mini-bar
  const severityCounts = SEVERITY_ORDER.map((s) => ({
    severity: s,
    count: threats.filter((t) => t.severity === s).length,
  })).filter((s) => s.count > 0);

  // Aggregate stats
  const totalMitigations = threats.reduce((sum, t) => sum + (t.mitigations?.length ?? 0), 0);
  const maxRisk = threats.length > 0
    ? Math.max(...threats.map((t) => (t.likelihood ?? 0) * (t.impact ?? 0)))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={clsx(
        'rounded-2xl border flex flex-col',
        'border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-gray-900',
        'hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20',
        'transition-shadow duration-200',
      )}
    >
      {/* Header */}
      <div className="p-4 pb-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              meta?.bgColor,
              meta?.darkBg,
            )}
          >
            {meta?.icon && <meta.icon className={clsx('w-4 h-4', meta.color)} />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
              {category.fullName ?? meta?.fullName}
            </p>
          </div>

          {threats.length > 0 && (
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
              {threats.length}
            </span>
          )}
        </div>

        {/* Severity distribution bar */}
        {threats.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
              {severityCounts.map(({ severity, count }) => (
                <div
                  key={severity}
                  className={clsx('h-full first:rounded-l-full last:rounded-r-full', SEVERITY_BAR_COLOR[severity])}
                  style={{ width: `${(count / threats.length) * 100}%` }}
                />
              ))}
            </div>
            {maxRisk > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-600 tabular-nums shrink-0">
                max {maxRisk}
              </span>
            )}
          </div>
        )}

        {/* Summary */}
        {category.summary && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
            {category.summary.replace(/^#{1,4}\s+/gm, '')}
          </p>
        )}

        {/* Quick stats */}
        {threats.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-600">
            <span>{threats.flatMap((t) => t.affectedComponents ?? []).filter((v, i, a) => a.indexOf(v) === i).length} componentes</span>
            <span className="text-gray-200 dark:text-gray-700">|</span>
            <span>{totalMitigations} mitigacoes</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Threats list */}
      <div className="p-2 flex-1 flex flex-col gap-0.5">
        {threats.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic px-3 py-3">
            Nenhuma ameaca identificada.
          </p>
        ) : (
          threats.map((threat) => (
            <ThreatItem key={threat.id} threat={threat} />
          ))
        )}
      </div>
    </motion.div>
  );
}
