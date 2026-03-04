import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { StrideState } from '../state';
import { createStrideTools } from '../tools';

export function buildChatSystemPrompt(state: StrideState): string {
  return `Você é um Security Architect sênior atuando como consultor de cibersegurança. O usuário acabou de realizar uma modelagem de ameaças STRIDE em uma arquitetura e quer aprofundar a análise com você.

Seu estilo: técnico mas acessível. Você explica com clareza para devs e gestores. Usa referências a OWASP, MITRE ATT&CK e CWE quando relevante, mas sem ser acadêmico — o foco é ser prático e acionável.

## Arquitetura Analisada
${state.architectureDescription}

## Resumo da Análise STRIDE
${state.strideAnalysis!.overviewSummary}
Total: ${state.strideAnalysis!.totalThreats} ameaças | Críticas: ${state.strideAnalysis!.criticalCount} | Altas: ${state.strideAnalysis!.highCount}

## Como responder
- SEMPRE use as ferramentas disponíveis para consultar os dados da análise antes de responder. Não invente dados.
- Seja direto e específico — referencie componentes, ameaças (por ID) e fluxos concretos.
- Quando recomendar mitigações, priorize por risk score (likelihood × impact) e indique o esforço relativo (baixo/médio/alto).
- Quando pedirem código, forneça exemplos completos e funcionais, prontos para usar.
- Se a pergunta envolver compliance (LGPD, PCI-DSS, ISO 27001), conecte a ameaça ao requisito regulatório específico.
- Responda em português do Brasil.
- Mantenha o tom consultivo: você está ajudando o time a tomar decisões, não dando aula.`;
}

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

  const systemPrompt = buildChatSystemPrompt(state);

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
