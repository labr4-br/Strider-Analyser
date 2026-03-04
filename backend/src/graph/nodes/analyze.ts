import { StrideState } from '../state';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, Output } from 'ai';
import { strideAnalysisSchema } from '../../schemas/stride';
import { RunnableConfig } from '@langchain/core/runnables';

const CATEGORY_LABELS: Record<string, string> = {
  S: 'Identificando ameaças de Spoofing...',
  T: 'Analisando Tampering...',
  R: 'Verificando Repudiation...',
  I: 'Avaliando Information Disclosure...',
  D: 'Examinando Denial of Service...',
  E: 'Investigando Elevation of Privilege...',
};

const REASONING_MODELS = new Set(['o1', 'o1-mini', 'o3', 'o3-mini', 'o4-mini']);

type Writer = (data: unknown) => void;

export async function strideAnalysis(
  state: StrideState,
  config: RunnableConfig,
): Promise<Partial<StrideState>> {
  console.log('[stride_analysis] Starting. Model:', state.llmSettings.model);

  const writer = (config as RunnableConfig & { writer?: Writer }).writer;
  const emit = (data: unknown) => {
    if (writer) writer(data);
  };

  const openai = createOpenAI({ apiKey: state.llmSettings.apiKey });
  const modelId = state.llmSettings.model;
  const isReasoning = REASONING_MODELS.has(modelId);

  const model = openai(modelId);

  try {
    emit({ type: 'step', step: 'start', label: 'Iniciando análise STRIDE...' });

    const prompt = `Você é um especialista em cibersegurança realizando modelagem de ameaças STRIDE.

CONTEXTO — ARQUITETURA VALIDADA
O usuário já validou o seguinte entendimento da arquitetura:

${state.architectureDescription}

ETAPA 1 — DESCRIÇÃO DA ARQUITETURA
Copie a descrição da arquitetura acima para o campo architectureDescription.

ETAPA 2 — ANÁLISE STRIDE
Preencha overviewSummary com um resumo executivo e realize a análise STRIDE completa.

Para cada uma das 6 categorias STRIDE, identifique ameaças específicas baseadas nos componentes descritos.

Categorias (use exatamente estas keys e fullNames):
- S: Falsificação de Identidade (Spoofing)
- T: Adulteração (Tampering)
- R: Repúdio (Repudiation)
- I: Divulgação de Informação (Information Disclosure)
- D: Negação de Serviço (Denial of Service)
- E: Elevação de Privilégio (Elevation of Privilege)

Para cada ameaça, forneça:
- ID único (ex: S1, T2, R1)
- Título curto e descritivo
- Descrição detalhada da ameaça
- Severidade: Critical, High, Medium ou Low
- Likelihood (1-5): probabilidade de ocorrência
- Impact (1-5): impacto se explorada
- Justificativa do risco (riskJustification): explique POR QUE você atribuiu essa probabilidade e esse impacto, referenciando componentes e fluxos específicos
- Componentes afetados
- Mitigações recomendadas

IMPORTANTE: Identifique pelo menos 2-3 ameaças por categoria. Preencha totalThreats, criticalCount e highCount ao final.

Responda em português do Brasil. Seja específico para os componentes da arquitetura.`;

    const result = streamText({
      model,
      output: Output.object({ schema: strideAnalysisSchema }),
      messages: [{ role: 'user', content: prompt }],
      ...(isReasoning
        ? {
            providerOptions: {
              openai: {
                reasoningEffort: 'high' as const,
              },
            },
          }
        : {
            temperature: state.llmSettings.temperature,
          }),
    });

    // Use partialOutputStream as single stream consumer (avoids tee() deadlock)
    const seenCategories = new Set<string>();
    let lastPartialTime = 0;

    for await (const partial of result.partialOutputStream) {
      if (partial.categories && Array.isArray(partial.categories)) {
        for (const cat of partial.categories) {
          const key = cat?.key;
          if (key && !seenCategories.has(key)) {
            seenCategories.add(key);
            const label = CATEGORY_LABELS[key] || `Analisando ${key}...`;
            emit({ type: 'step', step: key, label });
          }
        }
      }

      const now = Date.now();
      if (now - lastPartialTime >= 500) {
        lastPartialTime = now;
        emit({ type: 'partial', data: partial });
      }
    }

    const analysis = await result.output;

    // Emit reasoning text (available after stream completes)
    if (isReasoning) {
      const reasoningText = await result.reasoningText;
      if (reasoningText) {
        emit({ type: 'reasoning', text: reasoningText });
      }
    }

    emit({ type: 'step', step: 'done', label: 'Análise STRIDE concluída' });

    console.log('[stride_analysis] Done. Categories:', analysis?.categories?.length, 'Threats:', analysis?.totalThreats);
    return {
      strideAnalysis: analysis,
      analysisStatus: 'done' as const,
      phase: 'analyzing' as const,
    };
  } catch (err) {
    console.error('[stride_analysis] Error:', err);
    throw err;
  }
}
