import { Router, Request, Response } from 'express';
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { strideAnalysisSchema } from '../schemas/stride';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    res.status(400).json({ error: 'No image provided' });
    return;
  }

  const result = streamObject({
    model: openai('gpt-4o'),
    schema: strideAnalysisSchema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: imageBase64,
          } as const,
          {
            type: 'text',
            text: `Você é um especialista em cibersegurança realizando modelagem de ameaças STRIDE.

ETAPA 1 — ENTENDIMENTO DA ARQUITETURA
Primeiro, preencha o campo architectureDescription com uma descrição técnica detalhada de tudo que você identificou no diagrama: todos os componentes, serviços, bancos de dados, APIs, filas, fronteiras de confiança, fluxos de dados, protocolos de comunicação, tecnologias e integrações externas. Seja exaustivo.

ETAPA 2 — ANÁLISE STRIDE
Em seguida, preencha overviewSummary com um resumo executivo e realize a análise STRIDE completa.

Para cada uma das 6 categorias STRIDE, identifique ameaças específicas baseadas nos componentes visíveis no diagrama.

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
- Componentes afetados (baseados no diagrama)
- Mitigações recomendadas

Responda em português do Brasil. Seja específico para os componentes do diagrama.`,
          },
        ],
      },
    ],
  });

  result.pipeTextStreamToResponse(res);
});

export default router;
