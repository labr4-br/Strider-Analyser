import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Shield, Target, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { Threat } from '../schemas/stride';

interface ThreatItemProps {
  threat: Partial<Threat>;
}

const SEVERITY_DOT: Record<string, string> = {
  Critical: 'bg-rose-400',
  High: 'bg-violet-400',
  Medium: 'bg-sky-400',
  Low: 'bg-teal-400',
};

const SEVERITY_ACCENT: Record<string, string> = {
  Critical: 'border-l-rose-400',
  High: 'border-l-violet-400',
  Medium: 'border-l-sky-400',
  Low: 'border-l-teal-400',
};

const SEVERITY_LABEL: Record<string, string> = {
  Critical: 'Critico',
  High: 'Alto',
  Medium: 'Medio',
  Low: 'Baixo',
};

const SEVERITY_BG: Record<string, string> = {
  Critical: 'bg-rose-400/8 dark:bg-rose-400/10',
  High: 'bg-violet-400/8 dark:bg-violet-400/10',
  Medium: 'bg-sky-400/6 dark:bg-sky-400/8',
  Low: 'bg-teal-400/6 dark:bg-teal-400/8',
};

function getRiskLabel(score: number) {
  if (score >= 16) return 'Critico';
  if (score >= 10) return 'Alto';
  if (score >= 5) return 'Medio';
  return 'Baixo';
}

function getRiskColor(score: number) {
  if (score >= 16) return 'text-rose-500';
  if (score >= 10) return 'text-violet-500';
  if (score >= 5) return 'text-sky-500';
  return 'text-teal-500';
}

export function ThreatItem({ threat }: ThreatItemProps) {
  const [open, setOpen] = useState(false);
  const severity = threat.severity ?? 'Medium';
  const riskScore = (threat.likelihood ?? 0) * (threat.impact ?? 0);

  return (
    <div
      className={clsx(
        'border-l-2 rounded-r-lg transition-colors duration-150',
        SEVERITY_ACCENT[severity],
        open ? SEVERITY_BG[severity] : 'hover:bg-gray-50 dark:hover:bg-gray-800/40',
      )}
    >
      {/* Collapsed row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', SEVERITY_DOT[severity])} />

        <span className="text-[11px] font-mono font-bold text-gray-400 dark:text-gray-500 shrink-0">
          {threat.id}
        </span>

        <span className="text-[13px] text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">
          {threat.title}
        </span>

        {threat.mitreAttackId && (
          <span
            className="text-[10px] font-mono px-1 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shrink-0 relative group/mitre cursor-default"
          >
            {threat.mitreAttackId}
            {threat.mitreDescription && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-md bg-gray-900 dark:bg-gray-100 text-[10px] leading-tight text-gray-100 dark:text-gray-900 whitespace-nowrap opacity-0 pointer-events-none group-hover/mitre:opacity-100 transition-opacity duration-150 z-20 shadow-lg">
                {threat.mitreDescription}
              </span>
            )}
          </span>
        )}

        {riskScore > 0 && (
          <span className={clsx('text-[11px] font-bold tabular-nums shrink-0', getRiskColor(riskScore))}>
            {riskScore}
          </span>
        )}

        <ChevronRight
          className={clsx(
            'w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0 transition-transform duration-200',
            open && 'rotate-90',
          )}
        />
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 space-y-3">
              {/* Description */}
              {threat.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pl-4">
                  {threat.description.replace(/^#{1,4}\s+/gm, '')}
                </p>
              )}

              {/* Risk breakdown */}
              {riskScore > 0 && (
                <div className="flex items-center gap-3 pl-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="text-gray-400 dark:text-gray-600">Prob.</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{threat.likelihood}/5</span>
                    <span className="text-gray-300 dark:text-gray-600 mx-0.5">x</span>
                    <span className="text-gray-400 dark:text-gray-600">Imp.</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{threat.impact}/5</span>
                    <span className="text-gray-300 dark:text-gray-600 mx-0.5">=</span>
                    <span className={clsx('font-bold', getRiskColor(riskScore))}>
                      {riskScore} {getRiskLabel(riskScore)}
                    </span>
                  </div>
                </div>
              )}

              {/* Risk justification */}
              {threat.riskJustification && (
                <div className="pl-4 flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 mt-0.5 text-gray-400 dark:text-gray-600 shrink-0" />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed italic">
                    {threat.riskJustification}
                  </p>
                </div>
              )}

              {/* Affected components */}
              {threat.affectedComponents && threat.affectedComponents.length > 0 && (
                <div className="pl-4 flex items-start gap-2">
                  <Target className="w-3 h-3 mt-0.5 text-gray-400 dark:text-gray-600 shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {threat.affectedComponents.map((comp, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mitigations */}
              {threat.mitigations && threat.mitigations.length > 0 && (
                <div className="pl-4 space-y-1">
                  {threat.mitigations.map((m, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Shield className="w-3 h-3 mt-0.5 text-indigo-400 dark:text-indigo-500 shrink-0" />
                      <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{m}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* MITRE ATT&CK card */}
              {threat.mitreAttackId && (
                <div className="pl-4 space-y-1">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      {threat.mitreAttackId}
                    </span>
                    {threat.mitreTactic && (
                      <>
                        <span className="text-amber-300 dark:text-amber-700">·</span>
                        <span className="text-[11px] text-amber-700 dark:text-amber-300">
                          {threat.mitreTactic}
                        </span>
                      </>
                    )}
                    {threat.mitreTechnique && (
                      <>
                        <span className="text-amber-300 dark:text-amber-700">&mdash;</span>
                        <span className="text-[11px] text-gray-600 dark:text-gray-400">
                          {threat.mitreTechnique}
                        </span>
                      </>
                    )}
                  </div>
                  {threat.mitreDescription && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed px-2.5">
                      {threat.mitreDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Compliance pills */}
              {threat.compliance && threat.compliance.length > 0 && (
                <div className="pl-4 flex flex-wrap gap-1">
                  {threat.compliance.map((c, i) => (
                    <span
                      key={i}
                      className={clsx(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium relative group/pill cursor-default',
                        c.framework === 'LGPD' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
                        c.framework === 'OWASP' && 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
                        c.framework === 'ISO 27001' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                        c.framework === 'PCI-DSS' && 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
                      )}
                    >
                      {c.framework} {c.reference}
                      {c.description && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-md bg-gray-900 dark:bg-gray-100 text-[10px] leading-tight text-gray-100 dark:text-gray-900 whitespace-nowrap opacity-0 pointer-events-none group-hover/pill:opacity-100 transition-opacity duration-150 z-20 shadow-lg max-w-[280px] text-wrap">
                          {c.description}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
