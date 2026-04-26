import { useRef, useState } from 'react';
import { parseDeckSheetPdf } from '../../utils/pdfImport';
import type { ParsedDeckEntry } from '../../utils/pdfImport';

interface Props {
  onImport: (entries: ParsedDeckEntry[], fileName: string) => void;
}

export function PdfImportButton({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ message: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setProgress({ message: '準備中...', pct: 0 });

    try {
      const entries = await parseDeckSheetPdf(file, (message, pct) => {
        setProgress({ message, pct });
      });

      if (entries.length === 0) {
        setError('カードが認識できませんでした。');
      } else {
        onImport(entries, file.name.replace(/\.pdf$/i, ''));
      }
    } catch (err) {
      setError('PDFの処理に失敗しました。');
      console.error(err);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="pdf-import">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <button
        className="btn btn-secondary"
        onClick={() => inputRef.current?.click()}
        disabled={progress !== null}
      >
        {progress ? '処理中...' : '📄 PDFからデッキ作成'}
      </button>

      {progress && (
        <div className="pdf-progress">
          <div className="pdf-progress-bar">
            <div className="pdf-progress-fill" style={{ width: `${progress.pct}%` }} />
          </div>
          <span className="pdf-progress-label">{progress.message}</span>
        </div>
      )}
      {error && <span className="pdf-error">{error}</span>}
    </div>
  );
}
