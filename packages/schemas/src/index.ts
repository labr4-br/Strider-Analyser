import { z } from 'zod';

export const threatSchema = z.object({
  id: z.string().describe('ID como S1, T2, etc.'),
  title: z.string().describe('Título curto da ameaça'),
  description: z.string().describe('Descrição detalhada'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  likelihood: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  riskJustification: z.string().describe('Justificativa contextual do score de risco: por que essa probabilidade e esse impacto para essa ameaça específica, baseado nos componentes e fluxos do diagrama'),
  affectedComponents: z.array(z.string()),
  mitigations: z.array(z.string()),
  mitreAttackId: z.string().nullable().describe('Código MITRE ATT&CK (ex: T1190). Null se ainda não enriquecido.'),
  mitreTactic: z.string().nullable().describe('Tática MITRE ATT&CK (ex: Initial Access). Null se ainda não enriquecido.'),
  mitreTechnique: z.string().nullable().describe('Técnica MITRE ATT&CK (ex: Exploit Public-Facing Application). Null se ainda não enriquecido.'),
  mitreDescription: z.string().nullable().describe('Explicação curta da técnica MITRE ATT&CK em português (1 frase). Null se ainda não enriquecido.'),
  compliance: z.array(z.object({
    framework: z.string(),
    reference: z.string(),
    description: z.string().describe('Explicação curta do controle/artigo em português (1 frase)'),
  })).nullable().describe('Frameworks de compliance violados. Null se ainda não enriquecido.'),
});

export const strideCategorySchema = z.object({
  key: z.enum(['S', 'T', 'R', 'I', 'D', 'E']),
  fullName: z.string(),
  summary: z.string(),
  threats: z.array(threatSchema),
});

export const strideAnalysisSchema = z.object({
  architectureDescription: z.string().describe('Descrição técnica detalhada de tudo que foi identificado no diagrama de arquitetura: componentes, fluxos de dados, protocolos, fronteiras de confiança, tecnologias e integrações'),
  overviewSummary: z.string().describe('Resumo executivo da análise'),
  categories: z.array(strideCategorySchema).length(6),
  totalThreats: z.number(),
  criticalCount: z.number(),
  highCount: z.number(),
});

export const eisenhowerItemSchema = z.object({
  threatId: z.string().describe('ID da ameaça (ex: S1, T2)'),
  title: z.string().describe('Título da ameaça para referência'),
  quadrant: z.enum(['do_first', 'schedule', 'delegate', 'eliminate']).describe('Quadrante da Matriz de Eisenhower'),
  justification: z.string().describe('Por que esta ameaça pertence a este quadrante, considerando contexto de negócio, esforço e dependências'),
  effort: z.enum(['low', 'medium', 'high']).describe('Esforço estimado para mitigação'),
  timeline: z.string().describe('Prazo sugerido (ex: "1-2 semanas", "próximo sprint", "Q2 2026")'),
  quickWin: z.boolean().describe('Se pode ser resolvido rapidamente com baixo esforço'),
});

export const actionPlanSchema = z.object({
  summary: z.string().describe('Resumo executivo da priorização: o que fazer primeiro e por quê'),
  items: z.array(eisenhowerItemSchema),
  quickWins: z.array(z.string()).describe('Lista de IDs de ameaças que são quick wins'),
  strategicRecommendation: z.string().describe('Recomendação estratégica de alto nível para o time: sequência ideal de execução considerando dependências entre mitigações'),
});

export type Threat = z.infer<typeof threatSchema>;
export type StrideCategoryData = z.infer<typeof strideCategorySchema>;
export type StrideAnalysis = z.infer<typeof strideAnalysisSchema>;
export type EisenhowerItem = z.infer<typeof eisenhowerItemSchema>;
export type ActionPlan = z.infer<typeof actionPlanSchema>;
