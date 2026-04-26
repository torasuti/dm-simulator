import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface ParsedDeckEntry {
  slot: number;
  name: string;
}

export type ProgressCallback = (message: string, progress: number) => void;

export async function parseDeckSheetPdf(
  file: File,
  onProgress?: ProgressCallback
): Promise<ParsedDeckEntry[]> {
  onProgress?.('PDFを読み込み中...', 5);

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // ページをcanvasに描画
  onProgress?.('ページをレンダリング中...', 15);
  const page = await pdf.getPage(1);
  const scale = 2.0; // 高解像度でOCR精度向上
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  onProgress?.('日本語OCRを実行中（30秒ほどかかります）...', 25);

  // Tesseract OCR
  const worker = await createWorker('jpn', 1, {
    workerPath: '/tesseract-worker.min.js',
    corePath: '/tesseract-core-relaxedsimd-lstm.wasm.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const pct = 25 + Math.round(m.progress * 60);
        onProgress?.(`OCR処理中... ${Math.round(m.progress * 100)}%`, pct);
      } else if (m.status === 'loading language traineddata') {
        onProgress?.(`日本語データ読み込み中... ${Math.round(m.progress * 100)}%`, 15 + Math.round(m.progress * 10));
      }
    },
  });

  const { data: { text } } = await worker.recognize(canvas);
  await worker.terminate();

  onProgress?.('テキストを解析中...', 90);

  onProgress?.('完了', 100);
  return parseOcrText(text);
}

function parseOcrText(text: string): ParsedDeckEntry[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const slotMap = new Map<number, string>();

  for (const line of lines) {
    // パターン: "1 カード名" / "1. カード名" / "No.1 カード名" / "①カード名"
    const m =
      line.match(/^(?:No\.?\s*)?(\d{1,2})[..\s：:\t、]+(.+)$/) ||
      line.match(/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳](.+)$/);

    if (m) {
      let slot: number;
      let name: string;

      if (m[0].match(/^[①-⑳]/)) {
        // 丸数字
        slot = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'.indexOf(m[0][0]) + 1;
        name = m[1].trim();
      } else {
        slot = parseInt(m[1]);
        name = m[2].trim();
      }

      if (slot >= 1 && slot <= 40 && name.length > 0) {
        slotMap.set(slot, name);
      }
    }
  }

  // スロット番号なしの行を順番に割り当て（フォールバック）
  if (slotMap.size < 5) {
    let slot = 1;
    for (const line of lines) {
      if (slot > 40) break;
      // 数字だけの行・短すぎる行・ヘッダーらしき行はスキップ
      if (/^\d+$/.test(line)) continue;
      if (line.length < 2) continue;
      if (/デッキ|枚|合計|sheet/i.test(line)) continue;
      slotMap.set(slot++, line);
    }
  }

  return Array.from(slotMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([slot, name]) => ({ slot, name }));
}
