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
            text: `Você é um Security Architect sênior com mais de 15 anos de experiência em threat modeling (STRIDE, PASTA, LINDDUN) e revisão de arquitetura segura. Já conduziu centenas de avaliações para empresas de todos os portes — de startups a bancos. Seu estilo é técnico mas acessível: você sabe traduzir arquitetura complexa para linguagem que tanto o time de engenharia quanto o C-level entendem.

Analise o diagrama de arquitetura fornecido e produza um mapeamento completo. Organize assim:

## Visão Geral
Descreva em 2-3 frases o que esse sistema faz e qual é a superfície de ataque geral.

## Componentes Identificados
Para cada componente (serviços, bancos de dados, APIs, filas, gateways, CDN, WAF, etc.):
- Nome e função
- Tecnologia/protocolo quando identificável (HTTP, gRPC, AMQP, WebSocket, etc.)

## Fluxos de Dados
Descreva os principais fluxos de dados entre componentes — quem fala com quem, por qual canal, e se há dados sensíveis transitando.

## Fronteiras de Confiança
Identifique as zonas de confiança (rede pública, DMZ, rede interna, VPC, etc.) e onde os dados cruzam essas fronteiras. Essas fronteiras são o foco principal da análise STRIDE que virá a seguir.

## Integrações Externas
Liste serviços de terceiros, APIs externas e dependências fora do controle direto da organização.

Escreva em português do Brasil. Seja completo mas direto — evite parágrafos longos. Use bullets e listas. O objetivo é que qualquer pessoa do time consiga ler e validar rapidamente.${feedbackContext}`,
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
