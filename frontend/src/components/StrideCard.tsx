import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StrideCategoryData } from '../schemas/stride';
import { STRIDE_CATEGORIES } from '../types/stride';
import { ThreatItem } from './ThreatItem';
import clsx from 'clsx';

interface StrideCardProps {
  category: Partial<StrideCategoryData>;
  index: number;
}

export function StrideCard({ category, index }: StrideCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = STRIDE_CATEGORIES.find((c) => c.key === category.key);
  const threats = category.threats ?? [];
  const visibleThreats = expanded ? threats : threats.slice(0, 3);
  const hasMore = threats.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={clsx(
        'rounded-2xl border p-5 flex flex-col gap-3 h-full',
        'border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-gray-900',
        'hover:shadow-md transition-shadow duration-200'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
            meta?.bgColor,
            meta?.darkBg
          )}
        >
          <span className={meta?.color}>{category.key}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-[10px] font-semibold uppercase tracking-wide', meta?.color)}>
            {category.key}
          </p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {category.fullName ?? meta?.fullName}
          </p>
        </div>
        {threats.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
            {threats.length} ameaça{threats.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Summary */}
      {category.summary && (
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {category.summary}
        </p>
      )}

      {/* Divider */}
      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Threats list — flex-1 para preencher o espaço restante */}
      <div className="flex flex-col gap-2 flex-1">
        {threats.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            {category.summary ? 'Nenhuma ameaça identificada.' : 'Carregando...'}
          </p>
        ) : (
          visibleThreats.map((threat) => (
            <ThreatItem key={threat.id} threat={threat} />
          ))
        )}
      </div>

      {/* Expand/collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 self-start transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> ver menos
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> ver mais ({threats.length - 3})
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
