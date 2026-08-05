'use client';

export type CertificateSignature = { name: string; imageUrl: string | null };

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
    ctx.fillText(entry.name, x, y + 40);

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
  await drawSignatures(ctx, content.signatures, CANVAS_HEIGHT - footerHeight - 60);

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

  ctx.font = `400 32px ${FONT_STACK}`;
  ctx.fillStyle = '#374151';
  for (const line of wrapText(ctx, content.body, maxTextWidth)) {
    ctx.fillText(line, centerX, y);
    y += 48;
  }

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
