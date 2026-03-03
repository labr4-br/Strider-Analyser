import { z } from 'zod';

export const threatSchema = z.object({
  id: z.string().describe('ID como S1, T2, etc.'),
  title: z.string().describe('Título curto da ameaça'),
  description: z.string().describe('Descrição detalhada'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  likelihood: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  affectedComponents: z.array(z.string()),
  mitigations: z.array(z.string()),
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

export type Threat = z.infer<typeof threatSchema>;
export type StrideCategoryData = z.infer<typeof strideCategorySchema>;
export type StrideAnalysis = z.infer<typeof strideAnalysisSchema>;
