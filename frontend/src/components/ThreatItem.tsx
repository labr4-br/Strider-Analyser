import { useState } from 'react';
import { Shield, CheckCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Threat } from '../schemas/stride';
import { SeverityBadge } from './SeverityBadge';

function getRiskLabel(score: number) {
  if (score >= 16) return { text: 'Crítico', color: 'text-red-500' };
  if (score >= 10) return { text: 'Alto', color: 'text-orange-500' };
  if (score >= 5) return { text: 'Médio', color: 'text-yellow-500' };
  return { text: 'Baixo', color: 'text-green-500' };
}

interface ThreatItemProps {
  threat: Partial<Threat>;
}

export function ThreatItem({ threat }: ThreatItemProps) {
  const [hovered, setHovered] = useState(false);
  const riskScore = (threat.likelihood ?? 0) * (threat.impact ?? 0);
  const riskLabel = getRiskLabel(riskScore);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 bg-white dark:bg-gray-800/50">
      {/* Header row: ID + Severity + Title */}
      <div className="flex items-center gap-2 flex-wrap">
        {threat.id && (
          <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {threat.id}
          </span>
        )}
        {threat.severity && <SeverityBadge severity={threat.severity} />}
        {threat.title && (
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0">
            {threat.title}
          </span>
        )}
        {riskScore > 0 && (
          <div
            className="ml-auto relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono cursor-default">
              {threat.likelihood}×{threat.impact} = <span className="font-bold">{riskScore}</span>
              <Info className="w-3 h-3 shrink-0 text-gray-400 dark:text-gray-500" />
            </span>

            {/* Tooltip */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 z-20 w-64 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-gray-50 dark:bg-gray-950 shadow-2xl shadow-black/20 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Score de Risco — {threat.id}</span>
                    <span className={`text-xs font-bold ${riskLabel.color}`}>{riskLabel.text}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                    <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-mono text-[11px]">
                      <span>Probabilidade: <strong className="text-gray-800 dark:text-gray-200">{threat.likelihood}/5</strong></span>
                      <span className="text-gray-400">×</span>
                      <span>Impacto: <strong className="text-gray-800 dark:text-gray-200">{threat.impact}/5</strong></span>
                      <span className="text-gray-400">=</span>
                      <span className={`font-bold ${riskLabel.color}`}>{riskScore}</span>
                    </div>
                    {threat.riskJustification ? (
                      <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                        {threat.riskJustification}
                      </p>
                    ) : (
                      <p className="leading-relaxed italic text-gray-500">
                        Justificativa não disponível para esta ameaça.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Description */}
      {threat.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
          {threat.description.replace(/^#{1,4}\s+/gm, '')}
        </p>
      )}

      {/* Affected components */}
      {threat.affectedComponents && threat.affectedComponents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {threat.affectedComponents.slice(0, 2).map((comp, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
            >
              {comp}
            </span>
          ))}
          {threat.affectedComponents.length > 2 && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              +{threat.affectedComponents.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Mitigations */}
      {threat.mitigations && threat.mitigations.length > 0 && (
        <ul className="space-y-1">
          {threat.mitigations.slice(0, 2).map((m, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              {i === 0 ? (
                <Shield className="w-3 h-3 mt-0.5 text-indigo-500 shrink-0" />
              ) : (
                <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />
              )}
              <span className="line-clamp-1">{m}</span>
            </li>
          ))}
          {threat.mitigations.length > 2 && (
            <li className="text-xs text-gray-400 dark:text-gray-500 pl-4">
              +{threat.mitigations.length - 2} mitigações
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
