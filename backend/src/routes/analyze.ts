import { Router, Request, Response } from 'express';
import { streamObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { strideAnalysisSchema } from '../schemas/stride';

const router = Router();

interface LLMSettings {
  model: string;
  maxTokens: number;
  apiKey: string;
  temperature: number;
}

router.post('/', async (req: Request, res: Response) => {
  const { imageBase64, llmSettings } = req.body;

  if (!imageBase64) {
    res.status(400).json({ error: 'No image provided' });
    return;
  }

  const settings = llmSettings as LLMSettings | undefined;
  const apiKey = settings?.apiKey;

  if (!apiKey) {
    res.status(400).json({ error: 'API key is required. Configure it in the settings.' });
    return;
  }

  try {
    const openai = createOpenAI({ apiKey });
    const model = openai(settings?.model ?? 'gpt-4o');

    const result = streamObject({
      model,
      schema: strideAnalysisSchema,
      maxOutputTokens: settings?.maxTokens ?? 16384,
      temperature: settings?.temperature ?? 0.7,
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
- Justificativa do risco (riskJustification): explique POR QUE você atribuiu essa probabilidade e esse impacto, referenciando componentes e fluxos específicos do diagrama. Ex: "Probabilidade 5 porque o API Gateway está exposto sem rate limiting; Impacto 4 porque compromete tokens de autenticação do Cognito"
- Componentes afetados (baseados no diagrama)
- Mitigações recomendadas

IMPORTANTE: Identifique pelo menos 2-3 ameaças por categoria. Preencha totalThreats, criticalCount e highCount ao final.

Responda em português do Brasil. Seja específico para os componentes do diagrama.`,
            },
          ],
        },
      ],
      onFinish({ object, error: finishError }) {
        if (finishError) {
          console.error('streamObject finished with error:', finishError);
        } else {
          console.log(`streamObject finished: ${object?.totalThreats ?? 0} threats`);
        }
      },
    });

    result.pipeTextStreamToResponse(res);
  } catch (err) {
    console.error('Analyze route error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed' });
    }
  }
});

export default router;
