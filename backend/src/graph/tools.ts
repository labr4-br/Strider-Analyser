import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { StrideAnalysis, Threat } from '../schemas/stride';

export function createStrideTools(analysis: StrideAnalysis) {
  const allThreats: Threat[] = analysis.categories.flatMap((c) => c.threats);

  const searchThreats = tool(
    async ({ query, category }) => {
      const q = query.toLowerCase();
      let threats = allThreats;

      if (category) {
        const cat = analysis.categories.find((c) => c.key === category);
        if (!cat) return JSON.stringify({ error: `Categoria ${category} não encontrada` });
        threats = cat.threats;
      }

      const results = threats.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.affectedComponents.some((c) => c.toLowerCase().includes(q)) ||
          t.mitigations.some((m) => m.toLowerCase().includes(q)),
      );

      return JSON.stringify(results.length > 0 ? results : { message: 'Nenhuma ameaça encontrada para a busca.' });
    },
    {
      name: 'search_threats',
      description:
        'Busca ameaças por palavra-chave nos títulos, descrições, componentes afetados e mitigações. Use para responder perguntas sobre ameaças específicas.',
      schema: z.object({
        query: z.string().describe('Termo de busca'),
        category: z
          .enum(['S', 'T', 'R', 'I', 'D', 'E'])
          .optional()
          .describe('Filtrar por categoria STRIDE (opcional)'),
      }),
    },
  );

  const filterThreats = tool(
    async ({ severity, minRiskScore, component }) => {
      let results = allThreats;

      if (severity) {
        results = results.filter((t) => t.severity === severity);
      }
      if (minRiskScore !== undefined) {
        results = results.filter((t) => t.likelihood * t.impact >= minRiskScore);
      }
      if (component) {
        const comp = component.toLowerCase();
        results = results.filter((t) => t.affectedComponents.some((c) => c.toLowerCase().includes(comp)));
      }

      return JSON.stringify(
        results.length > 0
          ? results.map((t) => ({
              ...t,
              riskScore: t.likelihood * t.impact,
            }))
          : { message: 'Nenhuma ameaça encontrada com os filtros informados.' },
      );
    },
    {
      name: 'filter_threats',
      description:
        'Filtra ameaças por severidade, score de risco mínimo ou componente afetado. Use para listar ameaças de um determinado nível ou componente.',
      schema: z.object({
        severity: z
          .enum(['Critical', 'High', 'Medium', 'Low'])
          .optional()
          .describe('Filtrar por severidade'),
        minRiskScore: z
          .number()
          .optional()
          .describe('Score mínimo de risco (likelihood * impact, 1-25)'),
        component: z.string().optional().describe('Nome do componente afetado'),
      }),
    },
  );

  const calculateRiskMatrix = tool(
    async ({ topN }) => {
      const n = topN ?? 5;

      const byCategory = analysis.categories.map((c) => {
        const scores = c.threats.map((t) => t.likelihood * t.impact);
        return {
          category: `${c.key} - ${c.fullName}`,
          threatCount: c.threats.length,
          avgRiskScore: scores.length > 0 ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
          maxRiskScore: scores.length > 0 ? Math.max(...scores) : 0,
        };
      });

      const severityDistribution = {
        Critical: allThreats.filter((t) => t.severity === 'Critical').length,
        High: allThreats.filter((t) => t.severity === 'High').length,
        Medium: allThreats.filter((t) => t.severity === 'Medium').length,
        Low: allThreats.filter((t) => t.severity === 'Low').length,
      };

      const componentRisk: Record<string, { count: number; totalScore: number }> = {};
      for (const t of allThreats) {
        const score = t.likelihood * t.impact;
        for (const comp of t.affectedComponents) {
          if (!componentRisk[comp]) componentRisk[comp] = { count: 0, totalScore: 0 };
          componentRisk[comp].count++;
          componentRisk[comp].totalScore += score;
        }
      }
      const topComponents = Object.entries(componentRisk)
        .map(([name, data]) => ({ name, ...data, avgScore: +(data.totalScore / data.count).toFixed(1) }))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, n);

      const topThreats = [...allThreats]
        .sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)
        .slice(0, n)
        .map((t) => ({ id: t.id, title: t.title, severity: t.severity, riskScore: t.likelihood * t.impact }));

      return JSON.stringify({
        totalThreats: allThreats.length,
        severityDistribution,
        byCategory,
        topComponents,
        topThreats,
      });
    },
    {
      name: 'calculate_risk_matrix',
      description:
        'Calcula estatísticas agregadas: ameaças por categoria, score médio, distribuição por severidade, componentes mais vulneráveis e top N ameaças. Use para visão geral de risco.',
      schema: z.object({
        topN: z.number().optional().describe('Quantidade de itens no ranking (padrão: 5)'),
      }),
    },
  );

  const recommendMitigations = tool(
    async ({ threatId, severity }) => {
      let targets = allThreats;

      if (threatId) {
        targets = targets.filter((t) => t.id === threatId);
        if (targets.length === 0) {
          return JSON.stringify({ error: `Ameaça ${threatId} não encontrada` });
        }
      }
      if (severity) {
        targets = targets.filter((t) => t.severity === severity);
      }

      targets.sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact);

      const seen = new Set<string>();
      const mitigations: Array<{
        threatId: string;
        threatTitle: string;
        severity: string;
        riskScore: number;
        mitigation: string;
      }> = [];

      for (const t of targets) {
        for (const m of t.mitigations) {
          const key = `${t.id}:${m}`;
          if (!seen.has(key)) {
            seen.add(key);
            mitigations.push({
              threatId: t.id,
              threatTitle: t.title,
              severity: t.severity,
              riskScore: t.likelihood * t.impact,
              mitigation: m,
            });
          }
        }
      }

      return JSON.stringify(
        mitigations.length > 0
          ? mitigations
          : { message: 'Nenhuma mitigação encontrada para os critérios informados.' },
      );
    },
    {
      name: 'recommend_mitigations',
      description:
        'Retorna mitigações priorizadas e deduplicadas, ranqueadas por risk score. Filtre por ID de ameaça ou severidade. Use para recomendar ações de correção.',
      schema: z.object({
        threatId: z.string().optional().describe('ID da ameaça específica (ex: S1, T2)'),
        severity: z
          .enum(['Critical', 'High', 'Medium', 'Low'])
          .optional()
          .describe('Filtrar por severidade'),
      }),
    },
  );

  return [searchThreats, filterThreats, calculateRiskMatrix, recommendMitigations];
}
