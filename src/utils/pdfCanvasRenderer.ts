import {
  BookChapter,
  BookConfig,
  PRESET_EDITIONS,
  generateMinimalValidPdfBytes,
} from './flipbookLogic';

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (src: unknown) => {
        promise: Promise<{
          numPages: number;
          getPage: (num: number) => Promise<{
            getViewport: (opts: { scale: number }) => { width: number; height: number };
            render: (ctx: {
              canvasContext: CanvasRenderingContext2D;
              viewport: { width: number; height: number };
            }) => { promise: Promise<void> };
          }>;
        }>;
      };
    };
  }
}

export interface RenderedPageAsset {
  pageNumber: number;
  dataUrl: string;
  thumbnailUrl: string;
  title: string;
  kicker: string;
}

export interface RenderedBookBundle {
  pages: RenderedPageAsset[];
  pdfBytes: Uint8Array;
  totalPages: number;
}

const PDFJS_WORKER_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function ensurePdfJsWorker() {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
    }
  }
}

/**
 * Renders an actual PDF binary or URL using PDF.js with full Retina devicePixelRatio sharpness.
 */
export async function renderPdfBinaryWithPdfJs(
  source: { data?: Uint8Array; url?: string },
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPageAsset[]> {
  ensurePdfJsWorker();
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('Pustaka PDF.js belum dimuat. Periksa koneksi jaringan Anda.');
  }

  const loadingTask = source.data
    ? pdfjsLib.getDocument({ data: source.data.slice() })
    : pdfjsLib.getDocument({ url: source.url, withCredentials: false });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  if (!numPages || numPages < 1) {
    throw new Error('Dokumen PDF tidak memiliki halaman yang valid.');
  }

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 2, 2.5) : 2;
  const pages: RenderedPageAsset[] = [];

  for (let pageNo = 1; pageNo <= numPages; pageNo++) {
    onProgress?.(pageNo, numPages);
    const page = await pdfDoc.getPage(pageNo);

    // Base logical width ~620px multiplied by devicePixelRatio for razor-sharp Retina text
    const unscaledViewport = page.getViewport({ scale: 1 });
    const targetLogicalWidth = 620;
    const baseScale = targetLogicalWidth / Math.max(1, unscaledViewport.width);
    const hiDpiViewport = page.getViewport({ scale: baseScale * dpr });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(hiDpiViewport.width);
    canvas.height = Math.round(hiDpiViewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Gagal menginisialisasi konteks kanvas 2D.');

    ctx.fillStyle = '#FCFBF8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: hiDpiViewport,
    }).promise;

    // Generate compact thumbnail canvas
    const thumbCanvas = document.createElement('canvas');
    const thumbScale = 180 / canvas.width;
    thumbCanvas.width = 180;
    thumbCanvas.height = Math.round(canvas.height * thumbScale);
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }

    pages.push({
      pageNumber: pageNo,
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      thumbnailUrl: thumbCanvas.toDataURL('image/jpeg', 0.8),
      title: pageNo === 1 ? 'Sampul Depan' : `Halaman ${pageNo}`,
      kicker: `HALAMAN ${String(pageNo).padStart(2, '0')}`,
    });
  }

  return pages;
}

/**
 * Draws a rich, high-DPI museum monograph page onto an HTML5 Canvas using window.devicePixelRatio.
 */
function drawEditorialChapterCanvas(
  config: BookConfig,
  chapter: BookChapter,
  totalPages: number,
  dpr: number
): { dataUrl: string; thumbnailUrl: string } {
  const logicalW = 600;
  const logicalH = 820;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(logicalW * dpr);
  canvas.height = Math.round(logicalH * dpr);

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const isCover = chapter.pageNumber === 1;
  const isBackCover = chapter.pageNumber === totalPages && totalPages > 1;
  const preset = PRESET_EDITIONS[config.presetId] || PRESET_EDITIONS['arch-light'];

  if (isCover) {
    // Rich Hardcover Front Page Design
    ctx.fillStyle = preset.coverTint;
    ctx.fillRect(0, 0, logicalW, logicalH);

    // Subtle paper grain / architectural grid lines on cover
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, logicalW - 64, logicalH - 64);
    ctx.strokeRect(40, 40, logicalW - 80, logicalH - 80);

    // Top issue kicker
    ctx.fillStyle = '#D6CEBE';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText((config.issueNumber || preset.issueNumber).toUpperCase(), 60, 82);

    // Accent bar
    ctx.fillStyle = preset.accentHex;
    ctx.fillRect(60, 98, 68, 3);

    // Cover Title wrapped cleanly
    ctx.fillStyle = '#FBF9F5';
    ctx.font = '600 34px "Fraunces", Georgia, serif';
    const titleLines = wrapCanvasText(ctx, config.title || preset.title, logicalW - 120);
    let y = 156;
    titleLines.slice(0, 3).forEach((line) => {
      ctx.fillText(line, 60, y);
      y += 44;
    });

    // Subtitle / description
    ctx.fillStyle = '#D6CEBE';
    ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
    const descLines = wrapCanvasText(ctx, config.description || preset.description, logicalW - 120);
    y += 12;
    descLines.slice(0, 3).forEach((line) => {
      ctx.fillText(line, 60, y);
      y += 22;
    });

    // Architectural geometric emblem in center-bottom
    drawArchitecturalPlate(ctx, 60, 360, logicalW - 120, 290, preset.accentHex, 1, true);

    // Author & publisher footer
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(60, 692, logicalW - 120, 1);

    ctx.fillStyle = '#FBF9F5';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(config.author || preset.author, 60, 722);

    ctx.fillStyle = '#A8A29E';
    ctx.font = '400 11px "JetBrains Mono", monospace';
    ctx.fillText(`${config.publishedDate}  ·  ${chapter.figureCaption || 'Edisi Kuratorial'}`, 60, 746);
  } else {
    // Warm Archival Paper Interior Page
    ctx.fillStyle = isBackCover ? '#F0ECE1' : '#FBF9F5';
    ctx.fillRect(0, 0, logicalW, logicalH);

    // Subtle inner spine gradient shadow
    const isLeftPage = chapter.pageNumber % 2 === 0;
    const spineGrad = ctx.createLinearGradient(
      isLeftPage ? logicalW - 42 : 0,
      0,
      isLeftPage ? logicalW : 42,
      0
    );
    if (isLeftPage) {
      spineGrad.addColorStop(0, 'rgba(28, 25, 23, 0)');
      spineGrad.addColorStop(1, 'rgba(28, 25, 23, 0.09)');
      ctx.fillStyle = spineGrad;
      ctx.fillRect(logicalW - 42, 0, 42, logicalH);
    } else {
      spineGrad.addColorStop(0, 'rgba(28, 25, 23, 0.09)');
      spineGrad.addColorStop(1, 'rgba(28, 25, 23, 0)');
      ctx.fillStyle = spineGrad;
      ctx.fillRect(0, 0, 42, logicalH);
    }

    // Outer hairline border
    ctx.strokeStyle = '#E5DFD3';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, logicalW - 72, logicalH - 72);

    // Running Header
    ctx.fillStyle = '#78716C';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText(chapter.kicker, 58, 72);

    ctx.fillStyle = '#A8A29E';
    ctx.font = '400 10px "Plus Jakarta Sans", sans-serif';
    const shortBookTitle = (config.title || preset.title).slice(0, 38);
    const titleWidth = ctx.measureText(shortBookTitle).width;
    ctx.fillText(shortBookTitle, logicalW - 58 - titleWidth, 72);

    // Header rule
    ctx.fillStyle = '#D6CEBE';
    ctx.fillRect(58, 86, logicalW - 116, 1);

    // Chapter Heading
    ctx.fillStyle = '#1C1917';
    ctx.font = '600 25px "Fraunces", Georgia, serif';
    const headingLines = wrapCanvasText(ctx, chapter.title, logicalW - 116);
    let y = 124;
    headingLines.forEach((line) => {
      ctx.fillText(line, 58, y);
      y += 32;
    });

    // Subtitle
    ctx.fillStyle = chapter.accentColor || preset.accentHex;
    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    const subLines = wrapCanvasText(ctx, chapter.subtitle, logicalW - 116);
    subLines.forEach((line) => {
      ctx.fillText(line, 58, y);
      y += 20;
    });

    y += 14;

    // Architectural / Botanical Vector Plate Illustration
    drawArchitecturalPlate(
      ctx,
      58,
      y,
      logicalW - 116,
      195,
      chapter.accentColor || preset.accentHex,
      chapter.pageNumber,
      false
    );
    y += 212;

    // Figure Caption
    if (chapter.figureCaption) {
      ctx.fillStyle = '#57534E';
      ctx.font = 'italic 11px "Fraunces", Georgia, serif';
      ctx.fillText(chapter.figureCaption, 58, y);
      y += 26;
    }

    // Body Paragraphs with Drop Cap on first paragraph
    chapter.bodyParagraphs.forEach((para, pIndex) => {
      if (pIndex === 0 && para.length > 0) {
        const firstChar = para.charAt(0);
        const restText = para.slice(1).trimStart();

        ctx.fillStyle = chapter.accentColor || preset.accentHex;
        ctx.font = '700 38px "Fraunces", Georgia, serif';
        const dropCapW = Math.max(34, ctx.measureText(firstChar).width + 10);
        ctx.fillText(firstChar, 58, y + 32);

        ctx.fillStyle = '#292524';
        ctx.font = '400 13.5px "Plus Jakarta Sans", sans-serif';
        const indentedLines = wrapCanvasText(ctx, restText, logicalW - 116 - dropCapW);
        indentedLines.forEach((line, lIdx) => {
          const xOffset = lIdx < 2 ? 58 + dropCapW : 58;
          ctx.fillText(line, xOffset, y + 14 + lIdx * 21);
        });
        y += 14 + indentedLines.length * 21 + 12;
      } else {
        ctx.fillStyle = '#292524';
        ctx.font = '400 13.5px "Plus Jakarta Sans", sans-serif';
        const lines = wrapCanvasText(ctx, para, logicalW - 116);
        lines.forEach((line) => {
          ctx.fillText(line, 58, y);
          y += 21;
        });
        y += 12;
      }
    });

    // Optional Pull Quote Box
    if (chapter.pullQuote && y < logicalH - 135) {
      y += 6;
      ctx.fillStyle = '#E7E2D8';
      ctx.fillRect(58, y, logicalW - 116, 1);
      y += 22;

      ctx.fillStyle = '#1C1917';
      ctx.font = 'italic 14.5px "Fraunces", Georgia, serif';
      const quoteLines = wrapCanvasText(ctx, chapter.pullQuote, logicalW - 136);
      quoteLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, 68, y);
        y += 21;
      });
      y += 6;
      ctx.fillStyle = '#E7E2D8';
      ctx.fillRect(58, y, logicalW - 116, 1);
    }

    // Running Footer & Folio Number
    ctx.fillStyle = '#D6CEBE';
    ctx.fillRect(58, logicalH - 72, logicalW - 116, 1);

    ctx.fillStyle = '#57534E';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText(
      `FOLIO ${String(chapter.pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`,
      58,
      logicalH - 50
    );

    const authorLabel = (config.author || preset.author).slice(0, 34);
    const authorW = ctx.measureText(authorLabel).width;
    ctx.fillText(authorLabel, logicalW - 58 - authorW, logicalH - 50);
  }

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 180;
  thumbCanvas.height = 246;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (thumbCtx) {
    thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  }

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    thumbnailUrl: thumbCanvas.toDataURL('image/jpeg', 0.8),
  };
}

function drawArchitecturalPlate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor: string,
  seed: number,
  onDarkCover: boolean
) {
  ctx.save();
  ctx.fillStyle = onDarkCover ? 'rgba(255,255,255,0.04)' : '#F2EFE9';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = onDarkCover ? 'rgba(255,255,255,0.18)' : '#D6CEBE';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Subtle architectural grid
  ctx.strokeStyle = onDarkCover ? 'rgba(255,255,255,0.06)' : 'rgba(28,25,23,0.06)';
  const step = 28;
  for (let gx = x + step; gx < x + w; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y + step; gy < y + h; gy += step) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }

  // Geometric architectural elevation / golden section arcs
  const cx = x + w * 0.5;
  const cy = y + h * 0.54;

  ctx.fillStyle = accentColor;
  ctx.globalAlpha = onDarkCover ? 0.85 : 0.16;
  ctx.beginPath();
  ctx.arc(cx - (seed % 3) * 18, cy, Math.min(w, h) * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Structural columns & roof planes
  ctx.strokeStyle = onDarkCover ? '#FBF9F5' : '#1C1917';
  ctx.lineWidth = 1.5;

  const baseLineY = y + h - 28;
  ctx.beginPath();
  ctx.moveTo(x + 28, baseLineY);
  ctx.lineTo(x + w - 28, baseLineY);
  ctx.stroke();

  const colCount = 3 + (seed % 3);
  const spanW = w - 96;
  for (let i = 0; i < colCount; i++) {
    const colX = x + 48 + (spanW / (colCount - 1)) * i;
    const colTop = y + 42 + ((i + seed) % 2) * 18;
    ctx.beginPath();
    ctx.moveTo(colX, baseLineY);
    ctx.lineTo(colX, colTop);
    ctx.stroke();
  }

  // Cantilever roof beam
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 48);
  ctx.lineTo(x + w * 0.62, y + 26);
  ctx.lineTo(x + w - 24, y + 54);
  ctx.stroke();

  // Dimension callout
  ctx.fillStyle = onDarkCover ? '#D6CEBE' : '#57534E';
  ctx.font = '500 9px "JetBrains Mono", monospace';
  ctx.fillText(`SKALA 1:${50 + seed * 25}  ·  ELEVASI +${(seed * 3.4).toFixed(1)}M`, x + 14, y + 20);

  ctx.restore();
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = (text || '').split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Renders the selected Preset Edition with high-DPI canvases AND generates a real downloadable PDF binary.
 */
export async function renderPresetBookBundle(
  config: BookConfig,
  onProgress?: (current: number, total: number) => void
): Promise<RenderedBookBundle> {
  const preset = PRESET_EDITIONS[config.presetId] || PRESET_EDITIONS['arch-light'];
  const chapters = preset.chapters;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 2, 2.5) : 2;

  const pages: RenderedPageAsset[] = [];
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    onProgress?.(i + 1, chapters.length);
    const rendered = drawEditorialChapterCanvas(config, ch, chapters.length, dpr);
    pages.push({
      pageNumber: ch.pageNumber,
      dataUrl: rendered.dataUrl,
      thumbnailUrl: rendered.thumbnailUrl,
      title: ch.title,
      kicker: ch.kicker,
    });
  }

  const pdfBytes = generateMinimalValidPdfBytes(config, chapters);

  return {
    pages,
    pdfBytes,
    totalPages: pages.length,
  };
}
