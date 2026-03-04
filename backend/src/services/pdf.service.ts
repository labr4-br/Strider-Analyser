import PDFDocument from 'pdfkit';
import { StrideAnalysis, Threat } from '../schemas/stride';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  primary:   '#0f172a',
  accent:    '#4f46e5',
  muted:     '#64748b',
  border:    '#cbd5e1',
  text:      '#1e293b',
  textLight: '#475569',
};

// ─── STRIDE metadata ──────────────────────────────────────────────────────────
const STRIDE_META: Record<string, { color: string; label: string }> = {
  S: { color: '#dc2626', label: 'Falsificação de Identidade' },
  T: { color: '#ea580c', label: 'Adulteração' },
  R: { color: '#b45309', label: 'Repúdio' },
  I: { color: '#2563eb', label: 'Divulgação de Informações' },
  D: { color: '#7c3aed', label: 'Negação de Serviço' },
  E: { color: '#16a34a', label: 'Elevação de Privilégio' },
};

// ─── Severity colors ──────────────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High:     '#EA580C',
  Medium:   '#CA8A04',
  Low:      '#16A34A',
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const L = 50;
const R = 545;
const W = R - L;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hRule(doc: PDFKit.PDFDocument, color = C.border) {
  doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor(color).lineWidth(0.5).stroke();
}

/**
 * Writes the standard header + footer onto whatever page is currently active.
 * Safe to call from inside a bufferedPageRange loop via switchToPage().
 */
function addPageChrome(doc: PDFKit.PDFDocument, pageNum: number) {
  const pw = doc.page.width;
  const ph = doc.page.height;

  // Top bar
  doc.rect(0, 0, pw, 6).fill(C.accent);

  // Footer rule + text
  const fy = ph - 42;
  doc.moveTo(L, fy).lineTo(R, fy).strokeColor(C.border).lineWidth(0.5).stroke();

  doc
    .fontSize(8).font('Helvetica').fillColor(C.muted)
    .text('Análise de Modelagem de Ameaças STRIDE — Uso Acadêmico', L, fy + 7, {
      width: W - 50, lineBreak: false,
    });

  doc
    .fontSize(8).font('Helvetica').fillColor(C.muted)
    .text(`Página ${pageNum}`, L, fy + 7, {
      width: W, align: 'right', lineBreak: false,
    });
}

function sectionBadge(
  doc: PDFKit.PDFDocument,
  label: string,
  color: string,
  number: string,
) {
  const y = doc.y;
  doc.rect(L,     y, 4,    24).fill(color);
  doc.rect(L + 8, y, W - 8, 24).fill('#f8fafc');

  doc
    .fontSize(9).font('Helvetica-Bold').fillColor(color)
    .text(number, L + 14, y + 8, { continued: true })
    .fontSize(11).font('Helvetica-Bold').fillColor(C.text)
    .text(`  ${label}`, { lineBreak: false });

  doc.moveDown(1);
}

function severityBadge(doc: PDFKit.PDFDocument, severity: string, x: number, y: number) {
  const color = SEVERITY_COLORS[severity] || C.muted;
  const badgeW = 60;
  const badgeH = 14;
  doc.rect(x, y, badgeW, badgeH).fill(color);
  doc
    .fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
    .text(severity.toUpperCase(), x, y + 3, {
      width: badgeW, align: 'center', lineBreak: false,
    });
}

function renderThreat(doc: PDFKit.PDFDocument, threat: Threat, idx: number) {
  // Page break if not enough room
  if (doc.y > doc.page.height - 180) {
    doc.addPage();
    doc.y = 28;
  }

  const startY = doc.y;
  const riskScore = threat.likelihood * threat.impact;

  // Threat number + severity badge on same line
  doc
    .fontSize(10).font('Helvetica-Bold').fillColor(C.text)
    .text(`${idx + 1}. ${threat.title}`, L + 8, startY, {
      width: W - 80, lineBreak: false,
    });

  severityBadge(doc, threat.severity, R - 65, startY);
  doc.moveDown(0.5);

  // Description
  doc
    .fontSize(9).font('Helvetica').fillColor(C.textLight)
    .text(threat.description, L + 8, doc.y, { width: W - 16, lineGap: 2 });

  doc.moveDown(0.4);

  // Risk score row
  doc
    .fontSize(8.5).font('Helvetica-Bold').fillColor(C.muted)
    .text(`Risco: ${riskScore}/25  ·  Probabilidade: ${threat.likelihood}/5  ·  Impacto: ${threat.impact}/5`, L + 8, doc.y);

  doc.moveDown(0.5);

  // Affected components as tags
  if (threat.affectedComponents.length > 0) {
    doc
      .fontSize(8).font('Helvetica-Bold').fillColor(C.muted)
      .text('Componentes afetados:', L + 8, doc.y);
    doc.moveDown(0.2);

    let tagX = L + 8;
    const tagY = doc.y;
    const tagH = 13;

    for (const comp of threat.affectedComponents) {
      const tagW = Math.min(comp.length * 5.5 + 12, W - 16);
      if (tagX + tagW > R - 10) {
        tagX = L + 8;
        doc.y += tagH + 4;
      }
      doc.rect(tagX, tagY, tagW, tagH).fill('#e2e8f0');
      doc
        .fontSize(7).font('Helvetica').fillColor(C.text)
        .text(comp, tagX + 4, tagY + 3, { width: tagW - 8, lineBreak: false });
      tagX += tagW + 6;
    }
    doc.y = tagY + tagH + 6;
  }

  // Mitigations as bullet list
  if (threat.mitigations.length > 0) {
    doc.moveDown(0.3);
    doc
      .fontSize(8.5).font('Helvetica-Bold').fillColor(C.muted)
      .text('Mitigações:', L + 8, doc.y);
    doc.moveDown(0.2);

    for (const mitigation of threat.mitigations) {
      doc
        .fontSize(9).font('Helvetica').fillColor(C.text)
        .text(`•  ${mitigation}`, L + 16, doc.y, { width: W - 24, lineGap: 2 });
      doc.moveDown(0.2);
    }
  }

  doc.moveDown(0.6);
}

// ─── Identified Components ────────────────────────────────────────────────────
function renderIdentifiedComponents(doc: PDFKit.PDFDocument, analysis: StrideAnalysis) {
  doc.addPage();
  doc.y = 28;

  doc
    .fontSize(16).font('Helvetica-Bold').fillColor(C.primary)
    .text('2. Componentes Identificados', L, doc.y);

  doc.moveDown(0.4);
  hRule(doc);
  doc.moveDown(0.6);

  // Collect unique components and their threat associations
  const componentMap = new Map<string, { threatIds: string[]; maxSeverity: string; maxScore: number }>();
  const severityOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

  for (const cat of analysis.categories) {
    for (const threat of cat.threats) {
      for (const comp of threat.affectedComponents) {
        const existing = componentMap.get(comp);
        const score = severityOrder[threat.severity] || 0;
        if (existing) {
          existing.threatIds.push(threat.id);
          if (score > existing.maxScore) {
            existing.maxSeverity = threat.severity;
            existing.maxScore = score;
          }
        } else {
          componentMap.set(comp, { threatIds: [threat.id], maxSeverity: threat.severity, maxScore: score });
        }
      }
    }
  }

  if (componentMap.size === 0) {
    doc
      .fontSize(10).font('Helvetica').fillColor(C.textLight)
      .text('Nenhum componente foi identificado nas ameaças analisadas.', L, doc.y, { width: W });
    return;
  }

  doc
    .fontSize(10).font('Helvetica').fillColor(C.textLight)
    .text(
      'Os componentes a seguir foram identificados no diagrama de arquitetura e associados às ameaças detectadas.',
      L, doc.y, { width: W, lineGap: 3 },
    );

  doc.moveDown(1);

  // Numbered list
  const components = Array.from(componentMap.keys());
  components.forEach((comp, i) => {
    doc
      .fontSize(9).font('Helvetica').fillColor(C.text)
      .text(`${i + 1}. ${comp}`, L + 8, doc.y, { width: W - 16 });
    doc.moveDown(0.2);
  });

  doc.moveDown(1);

  // Cross-reference table
  doc
    .fontSize(11).font('Helvetica-Bold').fillColor(C.text)
    .text('Tabela Cruzada — Componentes × Ameaças', L, doc.y);
  doc.moveDown(0.6);

  // Table header
  const col1W = 200;
  const col2W = 200;
  const col3W = W - col1W - col2W;
  const rowH = 20;
  const tableX = L;
  let tableY = doc.y;

  doc.rect(tableX, tableY, W, rowH).fill(C.primary);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
    .text('Componente', tableX + 6, tableY + 6, { width: col1W - 12, lineBreak: false });
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
    .text('Ameaças (IDs)', tableX + col1W + 6, tableY + 6, { width: col2W - 12, lineBreak: false });
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
    .text('Severidade Máx.', tableX + col1W + col2W + 6, tableY + 6, { width: col3W - 12, lineBreak: false });

  tableY += rowH;

  // Sort by max severity descending
  const sorted = Array.from(componentMap.entries())
    .sort((a, b) => b[1].maxScore - a[1].maxScore);

  for (let i = 0; i < sorted.length; i++) {
    if (tableY > doc.page.height - 80) {
      doc.addPage();
      doc.y = 28;
      tableY = doc.y;
    }

    const [comp, info] = sorted[i];
    const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(tableX, tableY, W, rowH).fill(bg);

    doc.fontSize(8).font('Helvetica').fillColor(C.text)
      .text(comp, tableX + 6, tableY + 6, { width: col1W - 12, lineBreak: false });
    doc.fontSize(8).font('Helvetica').fillColor(C.text)
      .text(info.threatIds.join(', '), tableX + col1W + 6, tableY + 6, { width: col2W - 12, lineBreak: false });

    const sevColor = SEVERITY_COLORS[info.maxSeverity] || C.muted;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(sevColor)
      .text(info.maxSeverity, tableX + col1W + col2W + 6, tableY + 6, { width: col3W - 12, lineBreak: false });

    tableY += rowH;
  }

  doc.y = tableY + 10;
}

// ─── Risk Matrix helpers ───────────────────────────────────────────────────────
function riskMatrixColor(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score >= 16) return '#DC2626';
  if (score >= 10) return '#EA580C';
  if (score >= 5)  return '#CA8A04';
  return '#16A34A';
}

function renderRiskMatrix(doc: PDFKit.PDFDocument, analysis: StrideAnalysis) {
  doc.addPage();
  doc.y = 28;

  doc
    .fontSize(16).font('Helvetica-Bold').fillColor(C.primary)
    .text('4. Matriz de Risco', L, doc.y);

  doc.moveDown(0.4);
  hRule(doc);
  doc.moveDown(0.6);

  doc
    .fontSize(10).font('Helvetica').fillColor(C.textLight)
    .text(
      'A matriz abaixo posiciona cada ameaça identificada pelo eixo Probabilidade × Impacto. ' +
      'Zonas coloridas indicam o nível de risco: verde (baixo), amarelo (médio), laranja (alto), vermelho (crítico).',
      L, doc.y, { width: W, lineGap: 3 },
    );

  doc.moveDown(1);

  const cellSize = 62;
  const matrixX = L + 60;
  const matrixY = doc.y + 20;
  const labelOffset = 12;

  // Zone background colors
  const zoneColor = (col: number, row: number): string => {
    const likelihood = col + 1;
    const impact = 5 - row;
    return riskMatrixColor(likelihood, impact);
  };

  // Draw 5x5 grid zones
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = matrixX + col * cellSize;
      const y = matrixY + row * cellSize;
      const color = zoneColor(col, row);
      doc.fillOpacity(0.15).rect(x, y, cellSize, cellSize).fill(color);
      doc.fillOpacity(1).rect(x, y, cellSize, cellSize).stroke(C.border).lineWidth(0.5);
    }
  }
  doc.fillOpacity(1);

  // X-axis labels (Likelihood)
  doc
    .fontSize(8).font('Helvetica-Bold').fillColor(C.muted)
    .text('Probabilidade →', matrixX, matrixY + 5 * cellSize + 8, {
      width: 5 * cellSize, align: 'center',
    });

  for (let col = 0; col < 5; col++) {
    doc
      .fontSize(7).font('Helvetica').fillColor(C.muted)
      .text(`${col + 1}`, matrixX + col * cellSize, matrixY + 5 * cellSize + 20, {
        width: cellSize, align: 'center',
      });
  }

  // Y-axis labels (Impact)
  for (let row = 0; row < 5; row++) {
    doc
      .fontSize(7).font('Helvetica').fillColor(C.muted)
      .text(`${5 - row}`, matrixX - labelOffset - 10, matrixY + row * cellSize + cellSize / 2 - 4, {
        width: labelOffset + 8, align: 'right',
      });
  }

  doc
    .fontSize(8).font('Helvetica-Bold').fillColor(C.muted)
    .text('Impacto', matrixX - 50, matrixY + 2.5 * cellSize - 4, {
      width: 40, align: 'center',
    });

  // Collect all threats
  const allThreats: Array<{ threat: Threat; categoryKey: string }> = [];
  for (const cat of analysis.categories) {
    for (const threat of cat.threats) {
      allThreats.push({ threat, categoryKey: cat.key });
    }
  }

  // Plot threats as dots
  const dotRadius = 8;
  for (const { threat, categoryKey } of allThreats) {
    const col = threat.likelihood - 1;
    const row = 5 - threat.impact;
    const cx = matrixX + col * cellSize + cellSize / 2;
    const cy = matrixY + row * cellSize + cellSize / 2;
    const color = STRIDE_META[categoryKey]?.color || C.accent;

    doc.circle(cx, cy, dotRadius).fill(color);
    doc
      .fontSize(6).font('Helvetica-Bold').fillColor('#ffffff')
      .text(threat.id, cx - dotRadius, cy - 4, {
        width: dotRadius * 2, align: 'center', lineBreak: false,
      });
  }

  doc.y = matrixY + 5 * cellSize + 40;
  doc.moveDown(1);

  // Legend
  doc
    .fontSize(9).font('Helvetica-Bold').fillColor(C.text)
    .text('Legenda de Zonas de Risco:', L, doc.y);
  doc.moveDown(0.4);

  const zones = [
    { label: 'Crítico (16–25)', color: '#DC2626' },
    { label: 'Alto (10–15)',    color: '#EA580C' },
    { label: 'Médio (5–9)',     color: '#CA8A04' },
    { label: 'Baixo (1–4)',     color: '#16A34A' },
  ];

  let legendX = L;
  for (const zone of zones) {
    doc.rect(legendX, doc.y, 12, 12).fill(zone.color);
    doc
      .fontSize(8).font('Helvetica').fillColor(C.text)
      .text(zone.label, legendX + 16, doc.y + 1, { lineBreak: false });
    legendX += 110;
  }

  doc.moveDown(1.5);
}

// ─── Conclusion ──────────────────────────────────────────────────────────────
function renderConclusion(doc: PDFKit.PDFDocument, analysis: StrideAnalysis) {
  doc.addPage();
  doc.y = 28;

  doc
    .fontSize(16).font('Helvetica-Bold').fillColor(C.primary)
    .text('5. Conclusão e Recomendações Prioritárias', L, doc.y);

  doc.moveDown(0.4);
  hRule(doc);
  doc.moveDown(0.6);

  doc
    .fontSize(10).font('Helvetica').fillColor(C.textLight)
    .text(
      'Com base na análise realizada, as ameaças abaixo representam os maiores riscos para a arquitetura ' +
      'avaliada e devem ser tratadas com prioridade.',
      L, doc.y, { width: W, lineGap: 3 },
    );

  doc.moveDown(1);

  // Collect all threats with category info
  const allThreats: Array<{ threat: Threat; categoryKey: string; categoryName: string }> = [];
  for (const cat of analysis.categories) {
    for (const threat of cat.threats) {
      allThreats.push({ threat, categoryKey: cat.key, categoryName: cat.fullName });
    }
  }

  // Sort by risk score descending, take top 5
  const top5 = allThreats
    .sort((a, b) => (b.threat.likelihood * b.threat.impact) - (a.threat.likelihood * a.threat.impact))
    .slice(0, 5);

  if (top5.length === 0) {
    doc
      .fontSize(10).font('Helvetica').fillColor(C.textLight)
      .text('Nenhuma ameaça foi identificada na análise.', L, doc.y, { width: W });
    return;
  }

  top5.forEach(({ threat, categoryName }, i) => {
    if (doc.y > doc.page.height - 140) {
      doc.addPage();
      doc.y = 28;
    }

    const riskScore = threat.likelihood * threat.impact;

    // Number + title + severity badge
    doc
      .fontSize(10).font('Helvetica-Bold').fillColor(C.text)
      .text(`${i + 1}. ${threat.title}`, L + 8, doc.y, { width: W - 80, lineBreak: false });

    severityBadge(doc, threat.severity, R - 65, doc.y);
    doc.moveDown(0.6);

    // Category + risk score
    const meta = STRIDE_META[threat.id?.[0]] || { color: C.accent };
    doc
      .fontSize(9).font('Helvetica').fillColor(meta.color as string)
      .text(`Categoria: ${categoryName}`, L + 8, doc.y, { continued: true })
      .fillColor(C.muted)
      .text(`  ·  Risco: ${riskScore}/25`);

    doc.moveDown(0.4);

    // First mitigation as recommended action
    if (threat.mitigations.length > 0) {
      doc
        .fontSize(9).font('Helvetica-Bold').fillColor(C.text)
        .text('Ação recomendada: ', L + 8, doc.y, { continued: true })
        .font('Helvetica').fillColor(C.textLight)
        .text(threat.mitigations[0], { width: W - 16 });
    }

    doc.moveDown(0.8);

    if (i < top5.length - 1) {
      hRule(doc);
      doc.moveDown(0.6);
    }
  });
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
type ChatMessage = { role: string; text: string };

/**
 * Renders a markdown-ish text block into PDFKit.
 * Supports: ### headings, **bold**, bullet lines (- ), numbered lists, plain text.
 */
function renderMarkdownText(doc: PDFKit.PDFDocument, text: string, baseX: number, textWidth: number) {
  const lines = text.split('\n');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      doc.moveDown(0.3);
      continue;
    }

    if (doc.y > doc.page.height - 80) {
      doc.addPage();
      doc.y = 28;
    }

    // ### Heading
    if (/^#{1,4}\s+/.test(line)) {
      const heading = line.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '');
      doc
        .fontSize(10).font('Helvetica-Bold').fillColor(C.text)
        .text(heading, baseX, doc.y, { width: textWidth, lineGap: 2 });
      doc.moveDown(0.3);
      continue;
    }

    // Bullet line (- item) or numbered line (1. item)
    const bulletMatch = line.match(/^[-•]\s+(.*)/);
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (bulletMatch || numberedMatch) {
      const content = bulletMatch ? bulletMatch[1] : numberedMatch![2];
      const prefix = bulletMatch ? '•' : `${numberedMatch![1]}.`;
      renderInlineFormatted(doc, `${prefix}  ${content}`, baseX + 8, textWidth - 8);
      doc.moveDown(0.2);
      continue;
    }

    // Plain text with possible **bold** inline
    renderInlineFormatted(doc, line, baseX, textWidth);
    doc.moveDown(0.2);
  }
}

/** Renders a single line handling **bold** segments inline via plain text (no continued). */
function renderInlineFormatted(doc: PDFKit.PDFDocument, text: string, x: number, width: number) {
  // Strip all markdown bold/italic markers and render as plain text.
  // PDFKit's `continued` option is fragile with bufferedPages and causes ghost pages,
  // so we render the whole line as a single .text() call.
  const clean = text.replace(/\*{1,3}(.+?)\*{1,3}/g, '$1');
  doc
    .fontSize(9).font('Helvetica').fillColor(C.text)
    .text(clean, x, doc.y, { width, lineGap: 2 });
}

function renderFAQ(doc: PDFKit.PDFDocument, chatMessages: ChatMessage[]) {
  doc.addPage();
  doc.y = 28;

  doc
    .fontSize(16).font('Helvetica-Bold').fillColor(C.primary)
    .text('6. FAQ', L, doc.y);

  doc.moveDown(0.4);
  hRule(doc);
  doc.moveDown(0.6);

  doc
    .fontSize(10).font('Helvetica').fillColor(C.textLight)
    .text(
      'As perguntas e respostas abaixo foram coletadas durante a sessão de consultoria de segurança ' +
      'realizada após a análise STRIDE.',
      L, doc.y, { width: W, lineGap: 3 },
    );

  doc.moveDown(1);

  for (const msg of chatMessages) {
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
      doc.y = 28;
    }

    const isUser = msg.role === 'user';

    if (isUser) {
      // Question — styled as bold accent
      doc
        .fontSize(9.5).font('Helvetica-Bold').fillColor(C.accent)
        .text(`P: ${msg.text}`, L + 8, doc.y, { width: W - 16, lineGap: 2 });
      doc.moveDown(0.4);
    } else {
      // Answer — render with markdown formatting
      doc
        .fontSize(9).font('Helvetica-Bold').fillColor(C.text)
        .text('R:', L + 8, doc.y);
      doc.moveDown(0.2);
      renderMarkdownText(doc, msg.text, L + 16, W - 24);
      doc.moveDown(0.6);
    }
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function generatePDFReport(
  analysis: StrideAnalysis,
  imageBase64?: string,
  chatMessages?: ChatMessage[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {

    // bufferPages: true → all pages stay in memory until flushPages()
    // This lets us write chrome (header/footer) AFTER all content is laid out,
    // avoiding the pageAdded → text → auto-page → pageAdded infinite recursion.
    const doc = new PDFDocument({
      bufferPages: true,
      size:   'A4',
      margin: 50,
      info: {
        Title:    'Relatório de Modelagem de Ameaças STRIDE',
        Author:   'STRIDE Analyser',
        Subject:  'Modelagem de Ameaças de Segurança',
        Keywords: 'STRIDE, modelagem de ameaças, segurança, arquitetura',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data',  (c: Buffer) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PW = doc.page.width;

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 1 — COVER  (no standard chrome — handled separately in loop below)
    // ══════════════════════════════════════════════════════════════════════════

    // Institution label
    doc
      .fontSize(9).font('Helvetica').fillColor(C.muted)
      .text('FIAP · Hackathon Security Assessment', L, 30, {
        align: 'center', width: W,
      });

    // Title
    doc
      .fontSize(28).font('Helvetica-Bold').fillColor(C.primary)
      .text('Análise de Modelagem de Ameaças', L, 130, { align: 'center', width: W });

    doc
      .fontSize(13).font('Helvetica').fillColor(C.muted)
      .text('Framework STRIDE — Avaliação de Segurança de Arquitetura', L, 172, {
        align: 'center', width: W,
      });

    // Accent rule
    doc.y = 214;
    doc.moveTo(L + 60, doc.y).lineTo(R - 60, doc.y)
      .strokeColor(C.accent).lineWidth(1.5).stroke();
    doc.y += 32;

    // Overview summary
    doc
      .fontSize(10).font('Helvetica').fillColor(C.text)
      .text(analysis.overviewSummary, L + 20, doc.y, { width: W - 40, lineGap: 3 });

    doc.moveDown(1.2);

    // Threat counts row
    const countsY = doc.y;
    const colW = W / 3;

    const counts = [
      { label: 'Total de Ameaças', value: String(analysis.totalThreats), color: C.accent },
      { label: 'Críticas',         value: String(analysis.criticalCount), color: '#DC2626' },
      { label: 'Altas',            value: String(analysis.highCount),     color: '#EA580C' },
    ];

    counts.forEach(({ label, value, color }, i) => {
      const cx = L + i * colW;
      doc.rect(cx + 10, countsY, colW - 20, 48).fill('#f1f5f9');
      doc
        .fontSize(22).font('Helvetica-Bold').fillColor(color)
        .text(value, cx + 10, countsY + 6, { width: colW - 20, align: 'center' });
      doc
        .fontSize(8).font('Helvetica').fillColor(C.muted)
        .text(label, cx + 10, countsY + 32, { width: colW - 20, align: 'center' });
    });

    doc.y = countsY + 68;

    // Metadata table
    const metaStart = doc.y;
    const rowH      = 24;
    const colLabel  = L + 20;
    const colValue  = L + 180;

    const meta = [
      ['Tipo de Documento',  'Relatório de Modelagem de Ameaças'],
      ['Framework',          'STRIDE (Microsoft Threat Modeling)'],
      ['Classificação',      'Confidencial — Uso Acadêmico'],
      ['Gerado em',          new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })],
      ['Versão',             '1.0'],
    ];

    meta.forEach(([label, value], i) => {
      const ry = metaStart + i * rowH;
      if (i % 2 === 0) doc.rect(L, ry - 3, W, rowH).fill('#f1f5f9');
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted).text(label, colLabel, ry + 4);
      doc.fontSize(9).font('Helvetica').fillColor(C.text).text(value, colValue, ry + 4);
    });

    // Footer note on cover
    const noteY = doc.page.height - 90;
    doc.moveTo(L, noteY).lineTo(R, noteY).strokeColor(C.border).lineWidth(0.5).stroke();
    doc
      .fontSize(8).font('Helvetica').fillColor(C.muted)
      .text(
        'Este relatório foi gerado automaticamente pelo STRIDE Analyser utilizando modelos de IA com visão computacional. ' +
        'Os resultados devem ser revisados por um profissional de segurança qualificado.',
        L, noteY + 10, { align: 'center', width: W },
      );

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 2 — ARCHITECTURE DIAGRAM
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage();
    doc.y = 28;

    doc
      .fontSize(16).font('Helvetica-Bold').fillColor(C.primary)
      .text('1. Visão Geral da Arquitetura', L, doc.y);

    doc.moveDown(0.4);
    hRule(doc);
    doc.moveDown(0.8);

    doc
      .fontSize(10).font('Helvetica').fillColor(C.textLight)
      .text(
        'O diagrama abaixo representa a arquitetura do sistema analisada neste exercício de modelagem de ameaças. ' +
        'Todas as ameaças identificadas nas seções seguintes derivam dos componentes, fluxos de dados e ' +
        'fronteiras de confiança visíveis neste diagrama.',
        L, doc.y, { width: W, lineGap: 3 },
      );

    doc.moveDown(1.2);

    if (imageBase64) {
      try {
        const imgBuf = Buffer.from(imageBase64, 'base64');
        doc.image(imgBuf, L, doc.y, { fit: [W, 310], align: 'center' });
        doc.moveDown(1);
      } catch {
        doc.fontSize(9).fillColor(C.muted)
          .text('[Não foi possível renderizar o diagrama de arquitetura]', L, doc.y);
        doc.moveDown(1);
      }
    } else {
      doc.rect(L, doc.y, W, 50).fill('#f8fafc');
      doc.fontSize(9).fillColor(C.muted)
        .text('[Nenhum diagrama de arquitetura fornecido]', L, doc.y + 18, {
          align: 'center', width: W,
        });
      doc.moveDown(4);
    }

    doc
      .fontSize(8).font('Helvetica').fillColor(C.muted)
      .text('Figura 1 — Diagrama de arquitetura do sistema submetido para análise',
        L, doc.y, { align: 'center', width: W });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 1.1 — ARCHITECTURE UNDERSTANDING
    // ══════════════════════════════════════════════════════════════════════════
    if (analysis.architectureDescription) {
      doc.addPage();
      doc.y = 28;

      doc
        .fontSize(14).font('Helvetica-Bold').fillColor(C.primary)
        .text('1.1 Entendimento da Arquitetura', L, doc.y);

      doc.moveDown(0.4);
      hRule(doc);
      doc.moveDown(0.6);

      doc
        .fontSize(10).font('Helvetica').fillColor(C.textLight)
        .text(
          'Descrição técnica dos componentes, fluxos de dados, protocolos e integrações identificados no diagrama.',
          L, doc.y, { width: W, lineGap: 3 },
        );

      doc.moveDown(0.8);

      doc
        .fontSize(9).font('Helvetica').fillColor(C.text)
        .text(analysis.architectureDescription, L + 8, doc.y, { width: W - 16, lineGap: 3 });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 2 — IDENTIFIED COMPONENTS
    // ══════════════════════════════════════════════════════════════════════════
    renderIdentifiedComponents(doc, analysis);

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 3+ — STRIDE CATEGORY PAGES
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage();
    doc.y = 28;

    doc
      .fontSize(16).font('Helvetica-Bold').fillColor(C.primary)
      .text('3. Análise de Ameaças STRIDE', L, doc.y);

    doc.moveDown(0.4);
    hRule(doc);
    doc.moveDown(0.6);

    doc
      .fontSize(10).font('Helvetica').fillColor(C.textLight)
      .text(
        'As seções a seguir detalham as ameaças identificadas e as mitigações recomendadas para cada ' +
        'categoria STRIDE com base no diagrama de arquitetura submetido.',
        L, doc.y, { width: W, lineGap: 3 },
      );

    doc.moveDown(1.2);

    analysis.categories.forEach((cat, idx) => {
      const meta = STRIDE_META[cat.key];
      const color = meta?.color || C.accent;

      // Page break if not enough room for badge + a few lines
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
        doc.y = 28;
      }

      sectionBadge(doc, `${cat.fullName}`, color, `3.${idx + 1}`);

      // Category summary
      doc
        .fontSize(10).font('Helvetica').fillColor(C.textLight)
        .text(cat.summary, L + 8, doc.y, { width: W - 16, lineGap: 3 });

      doc.moveDown(0.8);

      // Threats
      cat.threats.forEach((threat, tIdx) => {
        renderThreat(doc, threat, tIdx);
      });

      if (idx < analysis.categories.length - 1) {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          doc.y = 28;
        } else {
          hRule(doc);
          doc.moveDown(0.8);
        }
      }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // RISK MATRIX PAGE
    // ══════════════════════════════════════════════════════════════════════════
    renderRiskMatrix(doc, analysis);

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 5 — CONCLUSION
    // ══════════════════════════════════════════════════════════════════════════
    renderConclusion(doc, analysis);

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 6 — FAQ (conditional)
    // ══════════════════════════════════════════════════════════════════════════
    if (chatMessages && chatMessages.length > 0) {
      renderFAQ(doc, chatMessages);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHROME PASS — add header/footer to every page now that content is fixed
    // ══════════════════════════════════════════════════════════════════════════
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    // Monkey-patch addPage to prevent .text() from creating ghost pages
    // during the chrome pass (known PDFKit bufferPages + switchToPage issue).
    const realAddPage = doc.addPage.bind(doc);
    doc.addPage = () => doc as PDFKit.PDFDocument;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(range.start + i);

      if (i === 0) {
        // Cover: custom top + bottom bars only
        doc.rect(0, 0, PW, 6).fill(C.accent);
        doc.rect(0, doc.page.height - 6, PW, 6).fill(C.accent);
      } else {
        addPageChrome(doc, i + 1);
      }
    }

    // Restore original addPage
    doc.addPage = realAddPage;

    doc.flushPages();
    doc.end();
  });
}
