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

    const prompt = `Você é um Security Architect sênior conduzindo uma modelagem de ameaças STRIDE. Você segue a metodologia Microsoft Threat Modeling, com referências a OWASP Top 10, MITRE ATT&CK e CWE quando aplicável. Seu estilo combina rigor técnico com clareza — o relatório será lido tanto pelo time de engenharia quanto pela liderança de negócio.

## Arquitetura Validada pelo Usuário

${state.architectureDescription}

## Sua Tarefa

### 1. architectureDescription
Reescreva a descrição da arquitetura de forma clara e estruturada, mantendo todos os componentes e fluxos identificados.

### 2. overviewSummary
Escreva um resumo executivo (3-5 frases) que responda: "qual é o nível de risco geral dessa arquitetura e quais são os pontos mais preocupantes?" — algo que um CISO ou gestor de produto consiga ler em 30 segundos e entender a situação.

### 3. Análise STRIDE Completa

Para cada uma das 6 categorias, identifique ameaças reais e específicas para ESTA arquitetura (não genéricas):

| Key | fullName |
|-----|----------|
| S | Falsificação de Identidade (Spoofing) |
| T | Adulteração (Tampering) |
| R | Repúdio (Repudiation) |
| I | Divulgação de Informação (Information Disclosure) |
| D | Negação de Serviço (Denial of Service) |
| E | Elevação de Privilégio (Elevation of Privilege) |

Para cada ameaça forneça:
- **id**: código único (S1, S2, T1, T2, etc.)
- **title**: título curto e direto (ex: "JWT sem rotação de chaves no API Gateway")
- **description**: o que pode acontecer, como um atacante exploraria, e qual o impacto real no negócio. Escreva de forma que um dev júnior entenda.
- **severity**: Critical, High, Medium ou Low
- **likelihood** (1-5): quão provável é essa ameaça considerando o estado atual da arquitetura
- **impact** (1-5): qual o dano se explorada (dados vazados, indisponibilidade, prejuízo financeiro, etc.)
- **riskJustification**: explique o raciocínio por trás do score — referencie componentes e fluxos específicos. Ex: "Likelihood 4 porque o API Gateway não mostra evidência de rate limiting, e Impact 5 porque um vazamento do banco de clientes afetaria compliance com LGPD."
- **affectedComponents**: lista dos componentes impactados
- **mitigations**: recomendações práticas e implementáveis. Prefira ações concretas ("implementar mTLS entre Service A e Service B") a conselhos vagos ("melhorar a segurança").

### Regras
- Mínimo 2-3 ameaças por categoria — se a arquitetura não expõe um risco óbvio em alguma categoria, explique por quê no summary da categoria
- Preencha totalThreats, criticalCount e highCount com os totais corretos
- Escreva em português do Brasil
- Seja específico para os componentes DESTA arquitetura — evite ameaças genéricas que se aplicariam a qualquer sistema`;

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
