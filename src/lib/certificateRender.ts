'use client';

export type CertificateSignature = { name: string; imageUrl: string | null; subtitle?: string | null };

export type CertificateContent = {
  headerUrl: string | null;
  footerUrl: string | null;
  signatures: CertificateSignature[];
  title: string;
  subtitle: string | null;
  body: string;
};

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1125;
const FONT_STACK = 'Arial, "Helvetica Neue", sans-serif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

type BodyBlock = { text: string; bold: boolean; align: 'left' | 'center' | 'right'; fontPx: number };

// El editor del admin guarda document.execCommand('fontSize', ...) como <font size="1-7">
// (escala HTML legacy, no píxeles) — solo usamos los 3 valores que ofrece el editor (2/4/6).
const FONT_SIZE_PX: Record<string, number> = { '2': 24, '4': 32, '6': 44 };

// El body del certificado se guarda como HTML (negrita, alineación y tamaño por línea).
// Cada Enter en el editor genera un <div>/<p> por línea; sin ninguno, todo el contenido
// se trata como un único bloque centrado (compatible con certificados guardados antes
// de este editor, que eran texto plano sin tags).
function parseBodyBlocks(html: string): BodyBlock[] {
  if (!html.trim()) return [];
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return [];

  const blockEls = Array.from(root.children).filter((el) => el.tagName === 'DIV' || el.tagName === 'P');
  const blocks = blockEls.length > 0 ? blockEls : [root];

  return blocks
    .map((el) => {
      const text = (el.textContent ?? '').trim();
      if (!text) return null;
      const bold = el.tagName === 'B' || el.tagName === 'STRONG' || !!el.querySelector('b, strong');
      const alignStyle = (el as HTMLElement).style?.textAlign || el.getAttribute('align') || '';
      const align: BodyBlock['align'] = alignStyle === 'left' ? 'left' : alignStyle === 'right' ? 'right' : 'center';
      const sizeAttr = el.querySelector('font[size]')?.getAttribute('size') ?? '';
      const fontPx = FONT_SIZE_PX[sizeAttr] ?? 32;
      return { text, bold, align, fontPx };
    })
    .filter((b): b is BodyBlock => b !== null);
}

function drawBodyBlocks(ctx: CanvasRenderingContext2D, blocks: BodyBlock[], startY: number, maxWidth: number) {
  let y = startY;
  const leftX = (CANVAS_WIDTH - maxWidth) / 2;
  const rightX = (CANVAS_WIDTH + maxWidth) / 2;
  const centerX = CANVAS_WIDTH / 2;

  ctx.fillStyle = '#374151';
  for (const block of blocks) {
    ctx.font = `${block.bold ? 700 : 400} ${block.fontPx}px ${FONT_STACK}`;
    ctx.textAlign = block.align;
    const x = block.align === 'left' ? leftX : block.align === 'right' ? rightX : centerX;
    const lineHeight = block.fontPx * 1.45;
    for (const line of wrapText(ctx, block.text, maxWidth)) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function drawSignatures(ctx: CanvasRenderingContext2D, signatures: CertificateSignature[], y: number) {
  const entries = signatures.filter((s) => s.name.trim());
  if (entries.length === 0) return;

  const images = await Promise.all(
    entries.map((s) => (s.imageUrl ? loadImage(s.imageUrl).catch(() => null) : Promise.resolve(null)))
  );

  const colWidth = 340;
  const gap = 60;
  const totalWidth = entries.length * colWidth + (entries.length - 1) * gap;
  let x = (CANVAS_WIDTH - totalWidth) / 2 + colWidth / 2;

  ctx.textAlign = 'center';
  entries.forEach((entry, i) => {
    const img = images[i];
    if (img) drawImageContain(ctx, img, x - 130, y - 90, 260, 80);

    ctx.strokeStyle = '#4c3fae';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 110, y);
    ctx.lineTo(x + 110, y);
    ctx.stroke();

    ctx.font = `600 26px ${FONT_STACK}`;
    ctx.fillStyle = '#374151';
    ctx.fillText(entry.name, x, y + 36);

    if (entry.subtitle) {
      ctx.font = `400 20px ${FONT_STACK}`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(entry.subtitle, x, y + 62);
    }

    x += colWidth + gap;
  });
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

async function renderCertificateCanvas(content: CertificateContent): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador no puede generar el certificado.');

  ctx.fillStyle = '#f5f3ef';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const headerHeight = CANVAS_HEIGHT * 0.26;
  const footerHeight = CANVAS_HEIGHT * 0.2;

  const [headerImg, footerImg] = await Promise.all([
    content.headerUrl ? loadImage(content.headerUrl) : null,
    content.footerUrl ? loadImage(content.footerUrl) : null,
  ]);

  if (headerImg) drawImageContain(ctx, headerImg, 0, 0, CANVAS_WIDTH, headerHeight);
  if (footerImg) drawImageContain(ctx, footerImg, 0, CANVAS_HEIGHT - footerHeight, CANVAS_WIDTH, footerHeight);
  await drawSignatures(ctx, content.signatures, CANVAS_HEIGHT - footerHeight - 75);

  const centerX = CANVAS_WIDTH / 2;
  const maxTextWidth = CANVAS_WIDTH * 0.7;
  let y = headerHeight + 110;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#4c3fae';
  ctx.font = `800 60px ${FONT_STACK}`;
  for (const line of wrapText(ctx, content.title, maxTextWidth)) {
    ctx.fillText(line, centerX, y);
    y += 78;
  }
  y += 20;

  if (content.subtitle) {
    ctx.font = `600 38px ${FONT_STACK}`;
    ctx.fillStyle = '#6c5ce7';
    for (const line of wrapText(ctx, content.subtitle, maxTextWidth)) {
      ctx.fillText(line, centerX, y);
      y += 52;
    }
    y += 30;
  }

  drawBodyBlocks(ctx, parseBodyBlocks(content.body), y, maxTextWidth);

  return canvas;
}

export async function downloadCertificatePdf(content: CertificateContent, filename: string) {
  const canvas = await renderCertificateCanvas(content);
  const dataUrl = canvas.toDataURL('image/png');

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [CANVAS_WIDTH, CANVAS_HEIGHT] });
  doc.addImage(dataUrl, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  doc.save(filename);
}
