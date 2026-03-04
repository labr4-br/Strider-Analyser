import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { StrideState } from '../state';
import { createStrideTools } from '../tools';

export async function chat(state: StrideState): Promise<Partial<StrideState>> {
  if (!state.strideAnalysis) {
    return {};
  }

  // No user messages yet — skip (first run after generate_questions)
  const hasUserMessage = state.messages.some(m => m._getType() === 'human');
  if (!hasUserMessage) {
    return {};
  }

  const tools = createStrideTools(state.strideAnalysis);

  const llm = new ChatOpenAI({
    model: state.llmSettings.model,
    temperature: 0.3,
    openAIApiKey: state.llmSettings.apiKey,
  });

  const systemPrompt = `Você é um consultor especialista em cibersegurança. O usuário realizou uma análise de ameaças STRIDE em um diagrama de arquitetura e agora quer fazer perguntas de follow-up.

## Descrição da Arquitetura
${state.architectureDescription}

## Resumo da Análise
${state.strideAnalysis.overviewSummary}
Total de ameaças: ${state.strideAnalysis.totalThreats} | Críticas: ${state.strideAnalysis.criticalCount} | Altas: ${state.strideAnalysis.highCount}

## Instruções
- Use as ferramentas disponíveis para consultar os dados da análise antes de responder.
- NÃO invente dados — sempre consulte as ferramentas para obter informações precisas.
- Responda em português do Brasil.
- Seja específico e prático nas recomendações.
- Quando solicitado código, forneça exemplos completos e funcionais.
- Ao recomendar mitigações, priorize por risk score (likelihood × impact).`;

  const agent = createReactAgent({
    llm,
    tools,
    prompt: systemPrompt,
  });

  const result = await agent.invoke({ messages: state.messages });

  return {
    messages: result.messages,
  };
}
