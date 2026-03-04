import { StrideState } from '../state';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const questionsSchema = z.object({
  questions: z.array(z.string()).min(5).max(8),
});

export async function generateQuestions(state: StrideState): Promise<Partial<StrideState>> {
  if (!state.strideAnalysis) {
    return { suggestedQuestions: [] };
  }

  const openai = createOpenAI({ apiKey: state.llmSettings.apiKey });
  const model = openai(state.llmSettings.model);

  const analysis = state.strideAnalysis;
  const topThreats = analysis.categories
    .flatMap(c => c.threats)
    .sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact))
    .slice(0, 5);

  const { object } = await generateObject({
    model,
    schema: questionsSchema,
    temperature: 0.7,
    prompt: `Você é um consultor de cibersegurança. Com base na análise STRIDE abaixo, gere entre 5 e 8 perguntas contextuais que ajudem o usuário a:
- Explorar as ameaças mais críticas em profundidade
- Entender as mitigações recomendadas
- Investigar componentes específicos da arquitetura
- Obter recomendações práticas de implementação

Resumo da análise:
${analysis.overviewSummary}

Top ameaças (por risk score):
${topThreats.map(t => `- ${t.id}: ${t.title} (${t.severity}, risco: ${t.likelihood * t.impact}/25)`).join('\n')}

Total: ${analysis.totalThreats} ameaças | Críticas: ${analysis.criticalCount} | Altas: ${analysis.highCount}

Gere perguntas em português do Brasil, específicas para esta análise. Cada pergunta deve ser direta e acionável.`,
  });

  return {
    suggestedQuestions: object.questions,
    phase: 'chat_ready' as const,
  };
}
