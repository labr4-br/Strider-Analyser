import { Router, Request, Response } from 'express';
import { Command } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createStrideGraph } from '../graph/index';
import { createStrideTools } from '../graph/tools';
import { LLMSettings, StrideState } from '../graph/state';

const router = Router();

interface RunRequest {
  imageBase64: string;
  llmSettings: LLMSettings;
  threadId?: string;
}

interface StreamRequest {
  threadId: string;
  action: 'resume' | 'message';
  feedback?: string;
  message?: string;
}

function setupSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

function sendEvent(res: Response, data: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

interface StrideProgressEvent {
  type: 'step' | 'partial' | 'reasoning';
  step?: string;
  label?: string;
  data?: unknown;
  text?: string;
}

async function processStream(
  stream: AsyncIterable<[string, unknown]>,
  res: Response,
) {
  let sentAnalyzingPhase = false;

  for await (const item of stream) {
    // Multi-mode stream yields 3-tuples: [namespace[], mode, payload]
    const tuple = item as unknown[];
    const mode = tuple.length === 3 ? tuple[1] : tuple[0];
    const payload = tuple.length === 3 ? tuple[2] : tuple[1];
    if (mode === 'custom') {
      const event = payload as StrideProgressEvent;
      if (event.type === 'step') {
        if (!sentAnalyzingPhase) {
          sendEvent(res, { type: 'phase', phase: 'analyzing' });
          sentAnalyzingPhase = true;
        }
        sendEvent(res, { type: 'step', step: event.step, label: event.label });
      } else if (event.type === 'partial') {
        sendEvent(res, { type: 'analysis_partial', partial: event.data });
      } else if (event.type === 'reasoning') {
        sendEvent(res, { type: 'reasoning_delta', text: event.text });
      }
      continue;
    }

    // mode === 'updates'
    const chunk = payload as Record<string, Record<string, unknown>>;
    for (const [nodeName, update] of Object.entries(chunk)) {
      const state = update as Record<string, unknown>;

      if (nodeName === 'understand_architecture') {
        if (state.architectureDescription) {
          sendEvent(res, { type: 'arch_delta', text: state.architectureDescription as string });
        }
      }

      if (nodeName === '__interrupt__' || (state.phase === 'validating' && state.validationStatus === 'pending')) {
        sendEvent(res, { type: 'phase', phase: 'validating' });
      }

      if (nodeName === 'stride_analysis') {
        if (!sentAnalyzingPhase) {
          sendEvent(res, { type: 'phase', phase: 'analyzing' });
          sentAnalyzingPhase = true;
        }
        if (state.strideAnalysis) {
          sendEvent(res, { type: 'analysis_delta', partial: state.strideAnalysis });
        }
      }

      if (nodeName === 'generate_questions') {
        if (state.suggestedQuestions) {
          sendEvent(res, { type: 'questions', questions: state.suggestedQuestions });
        }
        sendEvent(res, { type: 'phase', phase: 'chat_ready' });
      }

      if (nodeName === 'chat') {
        if (state.messages && Array.isArray(state.messages)) {
          const lastMsg = state.messages[state.messages.length - 1];
          if (lastMsg && typeof lastMsg === 'object' && 'content' in lastMsg) {
            sendEvent(res, { type: 'text_delta', text: String(lastMsg.content) });
          }
        }
      }
    }
  }
}

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    nodes: ['understand_architecture', 'human_validation', 'stride_analysis', 'generate_questions', 'chat'],
  });
});

router.post('/run', async (req: Request, res: Response) => {
  const { imageBase64, llmSettings, threadId: providedThreadId } = req.body as RunRequest;

  if (!imageBase64) {
    res.status(400).json({ error: 'No image provided' });
    return;
  }

  if (!llmSettings?.apiKey) {
    res.status(400).json({ error: 'API key is required' });
    return;
  }

  const threadId = providedThreadId || crypto.randomUUID();

  try {
    setupSSE(res);
    sendEvent(res, { type: 'phase', phase: 'understanding' });

    const graph = createStrideGraph();
    const config = { configurable: { thread_id: threadId } };

    const stream = await graph.stream(
      {
        imageBase64,
        llmSettings,
        threadId,
        createdAt: new Date().toISOString(),
        phase: 'understanding' as const,
        validationStatus: 'pending' as const,
        analysisStatus: 'pending' as const,
        suggestedQuestions: [],
        architectureDescription: '',
        architectureComponents: [],
        strideAnalysis: null,
      },
      { ...config, streamMode: ['updates', 'custom'] },
    );

    await processStream(
      stream as AsyncIterable<[string, unknown]>,
      res,
    );

    const snapshot = await graph.getState(config);
    if (snapshot.tasks && snapshot.tasks.some((t: { interrupts?: unknown[] }) => t.interrupts && t.interrupts.length > 0)) {
      sendEvent(res, { type: 'phase', phase: 'validating' });
      const currentState = snapshot.values as Record<string, unknown>;
      sendEvent(res, {
        type: 'interrupt',
        architectureDescription: currentState.architectureDescription || '',
      });
    }

    sendEvent(res, { type: 'done', threadId });
    res.end();
  } catch (err) {
    console.error('Graph run error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Graph execution failed' });
    } else {
      sendEvent(res, { type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      res.end();
    }
  }
});

router.post('/stream', async (req: Request, res: Response) => {
  const { threadId, action, feedback, message } = req.body as StreamRequest;

  if (!threadId) {
    res.status(400).json({ error: 'threadId is required' });
    return;
  }

  try {
    setupSSE(res);

    const graph = createStrideGraph();
    const config = { configurable: { thread_id: threadId } };

    if (action === 'resume') {
      const resumeValue = feedback
        ? { action: 'correct' as const, feedback }
        : { action: 'approve' as const };

      console.log('[graph/stream] Resuming with:', JSON.stringify(resumeValue));
      sendEvent(res, { type: 'phase', phase: feedback ? 'understanding' : 'analyzing' });

      const stream = await graph.stream(
        new Command({ resume: resumeValue }),
        { ...config, streamMode: ['updates', 'custom'] },
      );

      await processStream(
        stream as AsyncIterable<[string, unknown]>,
        res,
      );

      const snapshot = await graph.getState(config);
      if (snapshot.tasks && snapshot.tasks.some((t: { interrupts?: unknown[] }) => t.interrupts && t.interrupts.length > 0)) {
        sendEvent(res, { type: 'phase', phase: 'validating' });
        const currentState = snapshot.values as Record<string, unknown>;
        sendEvent(res, {
          type: 'interrupt',
          architectureDescription: currentState.architectureDescription || '',
        });
      }
    } else if (action === 'message' && message) {
      // Bypass graph — call ReAct agent directly (graph is already at END)
      const snapshot = await graph.getState(config);
      const state = snapshot.values as StrideState;

      if (!state.strideAnalysis) {
        sendEvent(res, { type: 'error', message: 'No analysis available' });
        sendEvent(res, { type: 'done', threadId });
        res.end();
        return;
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

      const agent = createReactAgent({ llm, tools, prompt: systemPrompt });

      // Build conversation: existing messages + new user message
      const allMessages = [...state.messages, new HumanMessage(message)];
      const result = await agent.invoke({ messages: allMessages });

      // Extract last assistant message
      const newMessages = result.messages.slice(allMessages.length);
      const assistantMsg = newMessages.filter(
        (m: { _getType(): string }) => m._getType() === 'ai',
      ).pop();

      if (assistantMsg && 'content' in assistantMsg) {
        sendEvent(res, { type: 'text_delta', text: String(assistantMsg.content) });
      }

      // Persist messages back to graph state for next turn
      await graph.updateState(config, {
        messages: [new HumanMessage(message), ...(assistantMsg ? [assistantMsg] : [])],
      });
    }

    sendEvent(res, { type: 'done', threadId });
    res.end();
  } catch (err) {
    console.error('Graph stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream failed' });
    } else {
      sendEvent(res, { type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      res.end();
    }
  }
});

export default router;
