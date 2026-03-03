import { Threat } from '../schemas/stride';

interface RiskMatrixProps {
  threats: Threat[];
}

function getCellColor(score: number): string {
  if (score >= 16) return 'bg-red-100 dark:bg-red-900/30';
  if (score >= 10) return 'bg-orange-100 dark:bg-orange-900/30';
  if (score >= 5)  return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-green-100 dark:bg-green-900/30';
}

export function RiskMatrix({ threats }: RiskMatrixProps) {
  // Group threats by (likelihood, impact) cell
  const cellThreats: Record<string, Threat[]> = {};
  for (const t of threats) {
    const key = `${t.likelihood}-${t.impact}`;
    if (!cellThreats[key]) cellThreats[key] = [];
    cellThreats[key].push(t);
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Matriz de Risco
      </h3>

      <div className="flex items-end gap-2">
        {/* Y-axis label */}
        <div className="flex items-center justify-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', minHeight: '140px' }}>
          <span className="text-xs text-gray-500 dark:text-gray-400 select-none">Impacto ↑</span>
        </div>

        {/* Grid + X-axis */}
        <div className="flex flex-col gap-1 flex-1">
          {/* Grid rows: impact 5 at top */}
          {[5, 4, 3, 2, 1].map((impact) => (
            <div key={impact} className="flex gap-1 items-center">
              <span className="text-xs text-gray-400 w-3 text-right select-none">{impact}</span>
              {[1, 2, 3, 4, 5].map((likelihood) => {
                const score = likelihood * impact;
                const key = `${likelihood}-${impact}`;
                const cellList = cellThreats[key] ?? [];
                return (
                  <div
                    key={likelihood}
                    className={`relative flex-1 aspect-square min-w-[28px] max-w-[56px] rounded flex flex-wrap items-center justify-center gap-0.5 p-0.5 ${getCellColor(score)}`}
                  >
                    {cellList.map((t) => (
                      <div
                        key={t.id}
                        title={`${t.id}: ${t.title}`}
                        className="w-2.5 h-2.5 rounded-full bg-gray-700 dark:bg-gray-200 opacity-80 cursor-default"
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}

          {/* X-axis numbers */}
          <div className="flex gap-1 items-center mt-1">
            <span className="w-3" />
            {[1, 2, 3, 4, 5].map((l) => (
              <span key={l} className="flex-1 text-center text-xs text-gray-400 select-none">{l}</span>
            ))}
          </div>

          {/* X-axis label */}
          <div className="text-center mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 select-none">Probabilidade →</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 inline-block" /> Baixo (1-4)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 inline-block" /> Médio (5-9)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30 inline-block" /> Alto (10-15)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 inline-block" /> Critico (16-25)</span>
      </div>
    </div>
  );
}
