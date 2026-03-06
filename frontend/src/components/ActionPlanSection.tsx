import { motion } from 'framer-motion';
import { Target, Zap, Clock, TrendingUp } from 'lucide-react';
import { ActionPlan } from '../schemas/stride';
import { EisenhowerMatrix } from './EisenhowerMatrix';
import { MarkdownText } from './MarkdownText';

interface ActionPlanSectionProps {
  actionPlan: ActionPlan;
}

const EFFORT_COUNT_COLORS: Record<string, string> = {
  low: 'text-teal-600 dark:text-teal-400',
  medium: 'text-sky-600 dark:text-sky-400',
  high: 'text-rose-600 dark:text-rose-400',
};

export function ActionPlanSection({ actionPlan }: ActionPlanSectionProps) {
  const doFirstCount = actionPlan.items.filter(i => i.quadrant === 'do_first').length;
  const scheduleCount = actionPlan.items.filter(i => i.quadrant === 'schedule').length;
  const delegateCount = actionPlan.items.filter(i => i.quadrant === 'delegate').length;
  const eliminateCount = actionPlan.items.filter(i => i.quadrant === 'eliminate').length;
  const quickWinCount = actionPlan.quickWins.length;

  const effortDistribution = {
    low: actionPlan.items.filter(i => i.effort === 'low').length,
    medium: actionPlan.items.filter(i => i.effort === 'medium').length,
    high: actionPlan.items.filter(i => i.effort === 'high').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Target className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Plano de Ação (Eisenhower)
        </h2>
        <span className="text-[11px] text-gray-400 dark:text-gray-600 tabular-nums">
          {actionPlan.items.length} ameaças priorizadas
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <EisenhowerMatrix actionPlan={actionPlan} />
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Distribuição por Quadrante
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Fazer Primeiro', count: doFirstCount, color: 'bg-rose-400', textColor: 'text-rose-600 dark:text-rose-400' },
                { label: 'Agendar', count: scheduleCount, color: 'bg-violet-400', textColor: 'text-violet-600 dark:text-violet-400' },
                { label: 'Delegar', count: delegateCount, color: 'bg-sky-400', textColor: 'text-sky-600 dark:text-sky-400' },
                { label: 'Monitorar', count: eliminateCount, color: 'bg-slate-400', textColor: 'text-slate-600 dark:text-slate-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                  <span className={`ml-auto text-sm font-bold ${item.textColor}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {quickWinCount > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Quick Wins
              </h3>
              <div className="space-y-1">
                {actionPlan.items
                  .filter(i => i.quickWin)
                  .map((item) => (
                    <div key={item.threatId} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                      <span className="font-mono font-bold text-gray-400 dark:text-gray-500 w-5 shrink-0">{item.threatId}</span>
                      <span className="text-gray-600 dark:text-gray-300 flex-1 min-w-0 truncate">{item.title}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5 shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {item.timeline}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Esforço de Mitigação
            </h3>
            <div className="flex items-center gap-4">
              {Object.entries(effortDistribution).map(([key, count]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <span className={`font-bold ${EFFORT_COUNT_COLORS[key]}`}>{count}</span>
                  <span className="text-gray-400 dark:text-gray-500">
                    {key === 'low' ? 'baixo' : key === 'medium' ? 'médio' : 'alto'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {actionPlan.summary && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Resumo da Priorização
              </h3>
              <MarkdownText text={actionPlan.summary} className="text-gray-600 dark:text-gray-400" />
            </div>
          )}

          {actionPlan.strategicRecommendation && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Recomendação Estratégica
              </h3>
              <MarkdownText text={actionPlan.strategicRecommendation} className="text-gray-600 dark:text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
