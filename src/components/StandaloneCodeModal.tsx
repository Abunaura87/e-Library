import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode2 } from 'lucide-react';
import { BookConfig } from '../utils/flipbookLogic';
import { buildStandaloneSingleFileHtml } from '../utils/standaloneHtmlBuilder';

interface StandaloneCodeModalProps {
  isOpen: boolean;
  config: BookConfig;
  onClose: () => void;
}

export const StandaloneCodeModal: React.FC<StandaloneCodeModalProps> = ({
  isOpen,
  config,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlCode = buildStandaloneSingleFileHtml(config);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(htmlCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (config.title || 'flipbook-3d')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    link.href = url;
    link.download = `${slug || 'flipbook'}-singlefile.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="standalone-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
    >
      <div className="w-full max-w-4xl bg-[#1C1917] border border-stone-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-stone-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <FileCode2 className="w-5 h-5 text-[#9A3412]" aria-hidden="true" />
            <div>
              <h2 id="standalone-modal-title" className="text-base font-semibold font-serif-editorial">
                Kode Lengkap Single-File HTML (HTML5 + Tailwind CDN + PDF.js + 3D Flipbook)
              </h2>
              <p className="text-xs text-stone-400">
                Siap dijalankan langsung di browser modern tanpa dependensi server lokal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog kode HTML"
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#141312] border-b border-stone-800">
          <div className="text-xs text-stone-400 font-mono-tabular">
            Pustaka CDN: Tailwind CSS · PDF.js 3.11.174 · StPageFlip · Lucide Icons
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-lg transition-colors whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Kode HTML Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Salin Seluruh Kode</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#9A3412] hover:bg-[#7C2D12] text-white rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Unduh File .HTML Tunggal</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#0E0D0C]">
          <pre className="text-xs font-mono-tabular text-stone-300 leading-relaxed select-all overflow-x-auto">
            <code>{htmlCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
