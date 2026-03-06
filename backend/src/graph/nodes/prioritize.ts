import { StrideState } from '../state';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { actionPlanSchema } from '../../schemas/stride';
import { RunnableConfig } from '@langchain/core/runnables';

type Writer = (data: unknown) => void;

export async function eisenhowerPrioritization(
  state: StrideState,
  config: RunnableConfig,
): Promise<Partial<StrideState>> {
  if (!state.strideAnalysis) {
    return { actionPlan: null };
  }

  const writer = (config as RunnableConfig & { writer?: Writer }).writer;
  const emit = (data: unknown) => {
    if (writer) writer(data);
  };

  emit({ type: 'step', step: 'prioritize_start', label: 'Priorizando ameaças (Eisenhower)...' });

  const openai = createOpenAI({ apiKey: state.llmSettings.apiKey });
  const model = openai(state.llmSettings.model);

  const analysis = state.strideAnalysis;
  const allThreats = analysis.categories
    .flatMap(c => c.threats)
    .sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact));

  const threatsSummary = allThreats.map(t =>
    `- ${t.id}: ${t.title} | Severidade: ${t.severity} | Risco: ${t.likelihood}×${t.impact}=${t.likelihood * t.impact} | Componentes: ${t.affectedComponents.join(', ')} | Mitigações: ${t.mitigations.length} propostas`
  ).join('\n');

  const { object } = await generateObject({
    model,
    schema: actionPlanSchema,
    temperature: 0.4,
    prompt: `Você é um Security Architect sênior priorizando as ameaças identificadas em uma modelagem STRIDE usando a Matriz de Eisenhower. Seu objetivo é transformar a lista de ameaças em um plano de ação executável.

## Arquitetura
${state.architectureDescription}

## Análise STRIDE
${analysis.overviewSummary}
Total: ${analysis.totalThreats} ameaças | Críticas: ${analysis.criticalCount} | Altas: ${analysis.highCount}

## Ameaças Identificadas (ordenadas por risk score)
${threatsSummary}

## Matriz de Eisenhower — Critérios de Classificação

### Q1 — Fazer Primeiro (Urgente + Importante)
Ameaças que representam risco iminente ao negócio: alta probabilidade de exploração, impacto severo, e onde a mitigação é viável a curto prazo. Tipicamente ameaças Critical/High com componentes expostos externamente.

### Q2 — Agendar (Importante, Não Urgente)
Ameaças de alto impacto mas que requerem planejamento, investimento ou mudanças arquiteturais significativas. São importantes mas não precisam de resposta imediata — podem ser planejadas para sprints futuros.

### Q3 — Delegar (Urgente, Não Importante)
Ameaças de baixo impacto mas que têm fix rápido disponível. Quick wins operacionais que podem ser delegados ao time — configurações, headers, hardening básico. O esforço é baixo e o ganho é incremental.

### Q4 — Monitorar (Não Urgente, Não Importante)
Ameaças de baixo risco que não justificam investimento imediato. Devem ser monitoradas e reavaliadas periodicamente. Não ignore — apenas priorize abaixo das demais.

## Regras
- Classifique TODAS as ${allThreats.length} ameaças
- A justificativa deve referenciar componentes específicos e contexto de negócio — não repita o score mecanicamente
- Identifique dependências entre mitigações (ex: "implementar mTLS antes de remover API key do header")
- Quick wins: ameaças onde a mitigação pode ser implementada em < 1 dia com baixo risco de regressão
- Timeline deve ser realista para um time de 3-5 devs
- A recomendação estratégica deve propor uma sequência de execução considerando dependências e ROI de segurança
- Escreva em português do Brasil`,
  });

  emit({ type: 'step', step: 'prioritize_done', label: 'Priorização concluída' });

  return {
    actionPlan: object,
  };
}
