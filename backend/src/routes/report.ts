import { Router, Request, Response } from 'express';
import { generatePDFReport } from '../services/pdf.service';
import { StrideAnalysis, ActionPlan } from '../schemas/stride';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { analysis, imageBase64, chatMessages, actionPlan } = req.body as {
    analysis: StrideAnalysis;
    imageBase64?: string;
    chatMessages?: Array<{ role: string; text: string }>;
    actionPlan?: ActionPlan;
  };

  if (!analysis) {
    res.status(400).json({ error: 'Analysis is required' });
    return;
  }

  try {
    const pdfBuffer = await generatePDFReport(analysis, imageBase64, chatMessages, actionPlan);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="stride-threat-report.pdf"'
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF generation failed';
    res.status(500).json({ error: message });
  }
});

export default router;
