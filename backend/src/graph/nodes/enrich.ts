import { z } from 'zod';
import { StrideState } from '../state';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { RunnableConfig } from '@langchain/core/runnables';
import { StrideAnalysis } from '../../schemas/stride';

const enrichmentSchema = z.object({
  enrichments: z.array(z.object({
    threatId: z.string(),
    mitreAttackId: z.string(),
    mitreTactic: z.string(),
    mitreTechnique: z.string(),
    mitreDescription: z.string().describe('Explicação curta da técnica MITRE em português (1 frase)'),
    compliance: z.array(z.object({
      framework: z.string(),
      reference: z.string(),
      description: z.string().describe('Explicação curta do controle/artigo em português (1 frase)'),
    })),
  })),
});

type Writer = (data: unknown) => void;

export async function enrichThreats(
  state: StrideState,
  config: RunnableConfig,
): Promise<Partial<StrideState>> {
  if (!state.strideAnalysis) return {};

  console.log('[enrich_threats] Starting enrichment');

  const writer = (config as RunnableConfig & { writer?: Writer }).writer;
  const emit = (data: unknown) => {
    if (writer) writer(data);
  };

  emit({ type: 'step', step: 'enrich_start', label: 'Enriquecendo com MITRE ATT&CK & Compliance...' });

  const openai = createOpenAI({ apiKey: state.llmSettings.apiKey });
  const model = openai(state.llmSettings.model);

  const allThreats = state.strideAnalysis.categories.flatMap(c =>
    c.threats.map(t => ({ id: t.id, title: t.title, description: t.description })),
  );

  const prompt = `Você é um especialista em segurança cibernética com profundo conhecimento do framework MITRE ATT&CK e regulamentações de compliance.

## Contexto da Arquitetura
${state.strideAnalysis.architectureDescription}

## Ameaças Identificadas
${allThreats.map(t => `- ${t.id}: ${t.title} — ${t.description}`).join('\n')}

## Sua Tarefa

Para CADA ameaça listada acima, forneça:

1. **MITRE ATT&CK**: a técnica mais relevante
   - mitreAttackId: código da técnica (ex: "T1190", "T1078", "T1059.001")
   - mitreTactic: tática do ATT&CK (ex: "Initial Access", "Credential Access", "Lateral Movement")
   - mitreTechnique: nome da técnica (ex: "Exploit Public-Facing Application", "Valid Accounts")
   - mitreDescription: explicação curta em português do que a técnica faz (1 frase, ex: "Exploração de aplicações expostas à internet para obter acesso inicial")

2. **Compliance**: frameworks regulatórios violados. Inclua APENAS os aplicáveis:
   - LGPD: artigos relevantes (ex: "Art. 46", "Art. 48") + description curta em português (ex: "Medidas de segurança para proteção de dados pessoais")
   - OWASP: referência do OWASP Top 10 2021 (ex: "A01:2021", "A03:2021") + description curta
   - ISO 27001: controles do Anexo A (ex: "A.14.1.2", "A.9.4.1") + description curta
   - PCI-DSS: requisitos (ex: "Req. 6.5", "Req. 8.3") + description curta

Seja preciso nos mapeamentos — cada ameaça deve ter a técnica MITRE mais específica possível e apenas os frameworks de compliance realmente aplicáveis.`;

  try {
    const { object } = await generateObject({
      model,
      schema: enrichmentSchema,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    // Merge enrichments into existing analysis
    const enrichMap = new Map(
      object.enrichments.map(e => [e.threatId, e]),
    );

    const enrichedAnalysis: StrideAnalysis = {
      ...state.strideAnalysis,
      categories: state.strideAnalysis.categories.map(cat => ({
        ...cat,
        threats: cat.threats.map(threat => {
          const enrichment = enrichMap.get(threat.id);
          if (!enrichment) return threat;
          return {
            ...threat,
            mitreAttackId: enrichment.mitreAttackId,
            mitreTactic: enrichment.mitreTactic,
            mitreTechnique: enrichment.mitreTechnique,
            mitreDescription: enrichment.mitreDescription,
            compliance: enrichment.compliance,
          };
        }),
      })),
    };

    emit({ type: 'step', step: 'enrich_done', label: 'Enriquecimento concluído' });

    console.log('[enrich_threats] Done. Enriched', object.enrichments.length, 'threats');
    return {
      strideAnalysis: enrichedAnalysis,
    };
  } catch (err) {
    console.error('[enrich_threats] Error:', err);
    throw err;
  }
}
