import { Router, Request, Response } from 'express';
import { UIMessage, pipeUIMessageStreamToResponse } from 'ai';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { StrideAnalysis } from '../schemas/stride';
import { createSecurityAdvisorGraph } from '../agents/security-advisor';

const router = Router();

// Event types the frontend useChat can safely consume
const ALLOWED_TYPES = new Set([
  'start',
  'finish',
  'text-start',
  'text-delta',
  'text-end',
  'start-step',
  'finish-step',
  'error',
]);

router.post('/', async (req: Request, res: Response) => {
  const { messages, analysisContext } = req.body as {
    messages: UIMessage[];
    analysisContext: StrideAnalysis;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Messages array required' });
    return;
  }

  if (!analysisContext) {
    res.status(400).json({ error: 'Analysis context required' });
    return;
  }

  try {
    const agent = createSecurityAdvisorGraph(analysisContext);
    const baseMessages = await toBaseMessages(messages);
    const langchainStream = await agent.stream(
      { messages: baseMessages },
      { streamMode: ['messages'] },
    );

    const rawStream = toUIMessageStream(langchainStream);

    // Filter out tool-related events that the frontend doesn't handle
    const filteredStream = rawStream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          if (chunk && typeof chunk === 'object' && 'type' in chunk) {
            if (ALLOWED_TYPES.has(chunk.type as string)) {
              controller.enqueue(chunk);
            }
          }
        },
      }),
    );

    pipeUIMessageStreamToResponse({
      stream: filteredStream,
      response: res,
    });
  } catch (err) {
    console.error('Chat agent error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
