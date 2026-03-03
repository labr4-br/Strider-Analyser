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
  S: { color: '#dc2626', label: 'Spoofing' },
  T: { color: '#ea580c', label: 'Tampering' },
  R: { color: '#b45309', label: 'Repudiation' },
  I: { color: '#2563eb', label: 'Information Disclosure' },
  D: { color: '#7c3aed', label: 'Denial of Service' },
  E: { color: '#16a34a', label: 'Elevation of Privilege' },
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
    .text('STRIDE Threat Model Analysis — Academic Use', L, fy + 7, {
      width: W - 50, lineBreak: false,
    });

  doc
    .fontSize(8).font('Helvetica').fillColor(C.muted)
    .text(`Page ${pageNum}`, L, fy + 7, {
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
    .text(`Risco: ${riskScore}/25  ·  Likelihood: ${threat.likelihood}/5  ·  Impact: ${threat.impact}/5`, L + 8, doc.y);

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

// ─── Risk Matrix helpers ───────────────────────────────────────────────────────
function riskMatrixColor(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score >= 16) return '#DC2626'; // Red
  if (score >= 9)  return '#EA580C'; // Orange
  if (score >= 4)  return '#CA8A04'; // Yellow
  return '#16A34A';                  // Green
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
      'A matriz abaixo posiciona cada ameaça identificada pelo eixo Likelihood (probabilidade) × Impact (impacto). ' +
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
      doc.rect(x, y, cellSize, cellSize).fill(color).fillOpacity(0.15);
      doc.rect(x, y, cellSize, cellSize).stroke(C.border).lineWidth(0.5);
    }
  }

  // X-axis labels (Likelihood)
  doc
    .fontSize(8).font('Helvetica-Bold').fillColor(C.muted)
    .text('Likelihood →', matrixX, matrixY + 5 * cellSize + 8, {
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
    .text('Impact', matrixX - 50, matrixY + 2.5 * cellSize - 4, {
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
    { label: 'Alto (9–15)',     color: '#EA580C' },
    { label: 'Médio (4–8)',     color: '#CA8A04' },
    { label: 'Baixo (1–3)',     color: '#16A34A' },
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

// ─── Main export ──────────────────────────────────────────────────────────────
export function generatePDFReport(
  analysis: StrideAnalysis,
  imageBase64?: string,
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
        Title:    'STRIDE Threat Model Analysis Report',
        Author:   'STRIDE Analyser',
        Subject:  'Security Threat Modeling',
        Keywords: 'STRIDE, threat modeling, security, architecture',
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
      .text('Threat Model Analysis', L, 130, { align: 'center', width: W });

    doc
      .fontSize(13).font('Helvetica').fillColor(C.muted)
      .text('STRIDE Framework — Architecture Security Assessment', L, 172, {
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
      ['Document Type',   'Security Threat Model Report'],
      ['Framework',       'STRIDE (Microsoft Threat Modeling)'],
      ['Classification',  'Confidential — Academic Use'],
      ['Generated',       new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })],
      ['Version',         '1.0'],
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
        'This report was automatically generated by STRIDE Analyser using AI vision models. ' +
        'Results should be reviewed by a qualified security professional.',
        L, noteY + 10, { align: 'center', width: W },
      );

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 2 — ARCHITECTURE DIAGRAM
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage();
    doc.y = 28;

    doc
      .fontSize(16).font('Helvetica-Bold').fillColor(C.primary)
      .text('1. Architecture Overview', L, doc.y);

    doc.moveDown(0.4);
    hRule(doc);
    doc.moveDown(0.8);

    doc
      .fontSize(10).font('Helvetica').fillColor(C.textLight)
      .text(
        'The diagram below represents the system architecture subject to this threat modeling ' +
        'exercise. All threats identified in the following sections are derived from the components, ' +
        'data flows, and trust boundaries visible in this diagram.',
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
          .text('[Architecture diagram could not be rendered]', L, doc.y);
        doc.moveDown(1);
      }
    } else {
      doc.rect(L, doc.y, W, 50).fill('#f8fafc');
      doc.fontSize(9).fillColor(C.muted)
        .text('[No architecture diagram provided]', L, doc.y + 18, {
          align: 'center', width: W,
        });
      doc.moveDown(4);
    }

    doc
      .fontSize(8).font('Helvetica').fillColor(C.muted)
      .text('Figure 1 — System architecture diagram submitted for analysis',
        L, doc.y, { align: 'center', width: W });

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 3+ — STRIDE CATEGORY PAGES
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage();
    doc.y = 28;

    doc
      .fontSize(16).font('Helvetica-Bold').fillColor(C.primary)
      .text('2. STRIDE Threat Analysis', L, doc.y);

    doc.moveDown(0.4);
    hRule(doc);
    doc.moveDown(0.6);

    doc
      .fontSize(10).font('Helvetica').fillColor(C.textLight)
      .text(
        'The following sections detail identified threats and recommended mitigations for each ' +
        'STRIDE category based on the submitted architecture diagram.',
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

      sectionBadge(doc, `${cat.fullName}`, color, `2.${idx + 1}`);

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
    // CHROME PASS — add header/footer to every page now that content is fixed
    // ══════════════════════════════════════════════════════════════════════════
    const range = doc.bufferedPageRange();

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);

      if (i === 0) {
        // Cover: custom top + bottom bars only
        doc.rect(0, 0, PW, 6).fill(C.accent);
        doc.rect(0, doc.page.height - 6, PW, 6).fill(C.accent);
      } else {
        addPageChrome(doc, i + 1);
      }
    }

    doc.flushPages();
    doc.end();
  });
}
