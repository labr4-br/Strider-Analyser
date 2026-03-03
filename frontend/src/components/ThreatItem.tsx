import { Shield, CheckCircle } from 'lucide-react';
import { Threat } from '../schemas/stride';
import { SeverityBadge } from './SeverityBadge';

interface ThreatItemProps {
  threat: Partial<Threat>;
}

export function ThreatItem({ threat }: ThreatItemProps) {
  const riskScore = (threat.likelihood ?? 0) * (threat.impact ?? 0);

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
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
            {threat.likelihood}×{threat.impact} = <span className="font-bold">{riskScore}</span>
          </span>
        )}
      </div>

      {/* Description — máx 2 linhas */}
      {threat.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
          {threat.description}
        </p>
      )}

      {/* Affected components — máx 2 tags */}
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

      {/* Mitigations — máx 2 itens */}
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
