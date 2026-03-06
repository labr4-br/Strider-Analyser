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
    prompt: `Você é um Security Architect sênior que acabou de concluir uma modelagem de ameaças STRIDE. Agora precisa sugerir as perguntas certas para que o time aprofunde os pontos mais relevantes.

## Contexto da Análise

${analysis.overviewSummary}

## Top Ameaças (por risk score)
${topThreats.map(t => `- ${t.id}: ${t.title} (${t.severity}, risco: ${t.likelihood * t.impact}/25)`).join('\n')}

Total: ${analysis.totalThreats} ameaças | Críticas: ${analysis.criticalCount} | Altas: ${analysis.highCount}

## Gere 5-8 perguntas que cubram estes ângulos:
- **Ameaças críticas**: "Como podemos mitigar [ameaça X] no [componente Y]?"
- **Quick wins**: oportunidades de reduzir risco com baixo esforço
- **Compliance**: implicações para LGPD, PCI-DSS ou regulatórias relevantes
- **Código**: pedidos de exemplo de implementação de mitigações
- **Priorização**: ajuda para decidir o que resolver primeiro

Escreva em português do Brasil. Cada pergunta deve ser direta, específica para ESTA análise, e acionável — algo que o time realmente perguntaria numa reunião de security review.`,
  });

  return {
    suggestedQuestions: object.questions,
  };
}
