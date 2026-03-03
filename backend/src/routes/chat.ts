import { Router, Request, Response } from 'express';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { StrideAnalysis } from '../schemas/stride';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { messages, analysisContext } = req.body as {
    messages: UIMessage[];
    analysisContext: StrideAnalysis;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Messages array required' });
    return;
  }

  const systemPrompt = `Você é um especialista em cibersegurança. O usuário realizou uma análise de ameaças STRIDE e agora quer fazer perguntas de follow-up.

Contexto da análise STRIDE realizada:
${JSON.stringify(analysisContext, null, 2)}

Responda em português do Brasil. Seja específico e prático nas recomendações.
Quando solicitado código, forneça exemplos completos e funcionais.`;

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: modelMessages,
  });

  result.pipeUIMessageStreamToResponse(res);
});

export default router;
