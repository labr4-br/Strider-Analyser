import { StrideState } from '../state';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { RunnableConfig } from '@langchain/core/runnables';

// Models that don't support vision — fallback to gpt-4o for image analysis
const NO_VISION = new Set(['o1', 'o1-mini', 'o3', 'o3-mini', 'o4-mini']);

type Writer = (data: unknown) => void;

export async function understandArchitecture(
  state: StrideState,
  config: RunnableConfig,
): Promise<Partial<StrideState>> {
  const writer = (config as RunnableConfig & { writer?: Writer }).writer;
  const emit = (data: unknown) => {
    if (writer) writer(data);
  };

  const openai = createOpenAI({ apiKey: state.llmSettings.apiKey });
  const selectedModel = state.llmSettings.model;

  // Always use a vision model for image analysis
  const visionModelId = NO_VISION.has(selectedModel) ? 'gpt-4o' : selectedModel;
  const model = openai(visionModelId);

  const feedbackContext = state.userFeedback
    ? `\n\nO usuário forneceu a seguinte correção sobre a análise anterior:\n${state.userFeedback}\n\nPor favor, refaça a análise levando em conta esse feedback.`
    : '';

  const result = streamText({
    model,
    temperature: state.llmSettings.temperature,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image: state.imageBase64 },
          {
            type: 'text',
            text: `Você é um especialista em arquitetura de software e cibersegurança.

Analise o diagrama de arquitetura fornecido e extraia uma descrição técnica detalhada contendo:
- Todos os componentes, serviços, bancos de dados, APIs, filas e gateways
- Fronteiras de confiança e zonas de segurança
- Fluxos de dados entre componentes
- Protocolos de comunicação (HTTP, gRPC, AMQP, etc.)
- Tecnologias e frameworks identificáveis
- Integrações externas e serviços de terceiros

Responda em português do Brasil. Seja exaustivo e técnico.${feedbackContext}`,
          },
        ],
      },
    ],
  });

  // Stream reasoning if available
  const streamReasoning = async () => {
    for await (const part of result.fullStream) {
      if (part.type === 'reasoning-delta') {
        emit({ type: 'reasoning', text: part.text });
      }
    }
  };

  // Collect text
  const collectText = async () => {
    return result.text;
  };

  const [, text] = await Promise.all([streamReasoning(), collectText()]);

  const components = text
    .split('\n')
    .filter(line => /^[-\u2022*]\s/.test(line.trim()))
    .map(line => line.replace(/^[-\u2022*]\s+/, '').trim())
    .filter(Boolean)
    .slice(0, 30);

  return {
    architectureDescription: text,
    architectureComponents: components.length > 0 ? components : [text.substring(0, 100)],
    phase: 'understanding' as const,
  };
}
