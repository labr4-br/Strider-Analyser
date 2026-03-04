import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { ActionPlan, EisenhowerItem } from '../schemas/stride';
import { Clock, Zap, CalendarClock, Users, Eye, ChevronDown } from 'lucide-react';

interface EisenhowerMatrixProps {
  actionPlan: ActionPlan;
}

const QUADRANTS = [
  {
    key: 'do_first' as const,
    label: 'Fazer Primeiro',
    subtitle: 'Urgente + Importante',
    icon: Zap,
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-900/40',
    iconColor: 'text-rose-400',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/30',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
  {
    key: 'schedule' as const,
    label: 'Agendar',
    subtitle: 'Importante, Não Urgente',
    icon: CalendarClock,
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-900/40',
    iconColor: 'text-violet-400',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/30',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  {
    key: 'delegate' as const,
    label: 'Delegar',
    subtitle: 'Urgente, Não Importante',
    icon: Users,
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    border: 'border-sky-200 dark:border-sky-900/40',
    iconColor: 'text-sky-400',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/30',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  {
    key: 'eliminate' as const,
    label: 'Monitorar',
    subtitle: 'Não Urgente, Não Importante',
    icon: Eye,
    bg: 'bg-slate-50 dark:bg-slate-800/30',
    border: 'border-slate-200 dark:border-slate-700/40',
    iconColor: 'text-slate-400',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/50',
    badgeText: 'text-slate-600 dark:text-slate-400',
  },
] as const;

const EFFORT_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixo', color: 'text-teal-600 dark:text-teal-400' },
  medium: { label: 'Médio', color: 'text-sky-600 dark:text-sky-400' },
  high: { label: 'Alto', color: 'text-rose-600 dark:text-rose-400' },
};

function QuadrantCell({
  quadrant,
  items,
  index,
}: {
  quadrant: typeof QUADRANTS[number];
  items: EisenhowerItem[];
  index: number;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const Icon = quadrant.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={clsx(
        'rounded-xl border p-3 flex flex-col gap-2 min-h-[120px]',
        quadrant.bg,
        quadrant.border,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={clsx('w-3.5 h-3.5', quadrant.iconColor)} />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {quadrant.label}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {quadrant.subtitle}
        </span>
        {items.length > 0 && (
          <span className={clsx('ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full', quadrant.badgeBg, quadrant.badgeText)}>
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
          Nenhuma ameaça neste quadrante
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const isExpanded = expandedId === item.threatId;
            const effort = EFFORT_LABELS[item.effort];

            return (
              <div key={item.threatId}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.threatId)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 w-5 shrink-0">
                    {item.threatId}
                  </span>
                  <span className="text-[11px] text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">
                    {item.title}
                  </span>
                  {item.quickWin && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 shrink-0">
                      quick win
                    </span>
                  )}
                  <ChevronDown
                    className={clsx(
                      'w-3 h-3 text-gray-400 transition-transform shrink-0',
                      isExpanded && 'rotate-180',
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 pb-2 space-y-1.5">
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                          {item.justification}
                        </p>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-gray-400 dark:text-gray-500">
                            Esforço: <span className={effort?.color}>{effort?.label}</span>
                          </span>
                          <span className="text-gray-300 dark:text-gray-700">|</span>
                          <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {item.timeline}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export function EisenhowerMatrix({ actionPlan }: EisenhowerMatrixProps) {
  const itemsByQuadrant = QUADRANTS.map((q) => ({
    quadrant: q,
    items: actionPlan.items.filter((item) => item.quadrant === q.key),
  }));

  return (
    <div className="grid grid-cols-2 gap-3">
      {itemsByQuadrant.map(({ quadrant, items }, i) => (
        <QuadrantCell key={quadrant.key} quadrant={quadrant} items={items} index={i} />
      ))}
    </div>
  );
}
