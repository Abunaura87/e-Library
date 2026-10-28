import React, { useRef, useState } from 'react';
import {
  Upload,
  Link2,
  BookOpen,
  Lock,
  Copy,
  Check,
  FileCode2,
  ExternalLink,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  BookConfig,
  PRESET_EDITIONS,
  PresetEdition,
  validatePdfUrlInput,
} from '../utils/flipbookLogic';

interface CreatorSidebarProps {
  config: BookConfig;
  shareUrl: string;
  isRendering: boolean;
  renderError: string | null;
  onUpdateConfig: (partial: Partial<BookConfig>) => void;
  onSelectPreset: (presetId: PresetEdition['id']) => void;
  onUploadLocalPdf: (file: File) => void;
  onLoadPdfUrl: (url: string) => void;
  onCopyShareLink: () => void;
  onOpenReaderMode: () => void;
  onLockBookNow: () => void;
  onOpenStandaloneModal: () => void;
}

export const CreatorSidebar: React.FC<CreatorSidebarProps> = ({
  config,
  shareUrl,
  isRendering,
  renderError,
  onUpdateConfig,
  onSelectPreset,
  onUploadLocalPdf,
  onLoadPdfUrl,
  onCopyShareLink,
  onOpenReaderMode,
  onLockBookNow,
  onOpenStandaloneModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [urlInput, setUrlInput] = useState(config.pdfUrl || '');
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUrlValidationError(null);
      onUploadLocalPdf(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUrlValidationError('Format berkas tidak didukung. Harap unggah dokumen berekstensi .pdf.');
      return;
    }
    setUrlValidationError(null);
    onUploadLocalPdf(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validatePdfUrlInput(urlInput);
    if (!check.valid) {
      setUrlValidationError(check.error || 'URL PDF tidak valid.');
      return;
    }
    setUrlValidationError(null);
    onLoadPdfUrl(urlInput.trim());
  };

  const handleCopyClick = () => {
    onCopyShareLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <aside
      aria-label="Panel Kendali Penerbit"
      className="no-print w-full lg:w-[420px] xl:w-[450px] shrink-0 border-b lg:border-b-0 lg:border-r border-stone-300/80 bg-[#F7F4EE] text-[#1C1917] overflow-y-auto p-6 space-y-7"
    >
      {/* Header Section */}
      <div className="border-b border-stone-300/80 pb-4">
        <p className="text-xs font-mono-tabular uppercase tracking-widest text-stone-500">
          01. Mode Pemilik & Studio Penerbit
        </p>
        <h1 className="text-xl font-semibold font-serif-editorial text-stone-900 mt-1">
          Konfigurasi Publikasi 3D Flipbook
        </h1>
        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
          Unggah dokumen PDF lokal, muat tautan PDF eksternal, atau sesuaikan hak akses pembaca secara real-time.
        </p>
      </div>

      {/* Section A: PDF Source (Drag & Drop + Direct URL + Curated Samples) */}
      <section className="space-y-4" aria-labelledby="section-source-heading">
        <div className="flex items-center justify-between">
          <h2 id="section-source-heading" className="text-sm font-semibold text-stone-900">
            01. Sumber Dokumen PDF
          </h2>
          <span className="text-xs text-stone-500 font-mono-tabular">
            {config.pdfSourceType === 'local'
              ? 'Berkas Lokal'
              : config.pdfSourceType === 'url'
              ? 'URL Langsung'
              : 'Katalog Edisi'}
          </span>
        </div>

        {/* Drag & Drop Local PDF Upload */}
        <label
          htmlFor="local-pdf-upload"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-5 rounded-lg border border-dashed transition-colors cursor-pointer text-center ${
            isDraggingOver
              ? 'border-[#9A3412] bg-[#9A3412]/5'
              : 'border-stone-400/80 bg-[#FBF9F5] hover:border-stone-700'
          }`}
        >
          <Upload className="w-5 h-5 text-[#9A3412] mb-2" aria-hidden="true" />
          <span className="text-xs font-semibold text-stone-900">
            Tarik & Lepas File PDF Lokal atau Klik untuk Memilih
          </span>
          <span className="text-xs text-stone-500 mt-1">
            {config.localFileName
              ? `Aktif: ${config.localFileName}`
              : 'Dirender tajam pada kanvas Retina (window.devicePixelRatio)'}
          </span>
          <input
            ref={fileInputRef}
            id="local-pdf-upload"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {/* Direct PDF URL Form */}
        <form onSubmit={handleUrlSubmit} className="space-y-2" noValidate>
          <label htmlFor="direct-pdf-url" className="block text-xs font-medium text-stone-700">
            Atau Muat Direct URL PDF
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2
                className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="direct-pdf-url"
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlValidationError) setUrlValidationError(null);
                }}
                placeholder="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-800"
              />
            </div>
            <button
              type="submit"
              disabled={isRendering}
              className="px-3.5 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              Muat URL
            </button>
          </div>
        </form>

        {/* Error feedback for URL or corrupted PDF */}
        {(urlValidationError || renderError) && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/5 border border-red-800/30 text-red-900 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold">Gagal Memuat Dokumen PDF</p>
              <p className="text-red-800/90 leading-relaxed">{urlValidationError || renderError}</p>
            </div>
          </div>
        )}

        {/* Preset Sample Editions for Instant Evaluation */}
        <div className="space-y-2 pt-1">
          <span className="block text-xs font-medium text-stone-600">
            Sampel Katalog PDF Bawaan (Siap Baca & Unduh):
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PRESET_EDITIONS) as Array<PresetEdition['id']>).map((key) => {
              const item = PRESET_EDITIONS[key];
              const isSelected = config.pdfSourceType === 'preset' && config.presetId === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setUrlValidationError(null);
                    onSelectPreset(key);
                  }}
                  className={`px-2.5 py-2 rounded-lg text-left border transition-colors ${
                    isSelected
                      ? 'bg-stone-900 text-stone-50 border-stone-900'
                      : 'bg-[#FBF9F5] text-stone-700 border-stone-300 hover:border-stone-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-medium truncate">
                      {key === 'arch-light'
                        ? 'Arsitektur'
                        : key === 'botanical-atlas'
                        ? 'Botani'
                        : 'Tipografi'}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 font-mono-tabular ${
                      isSelected ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    {item.chapters.length} Halaman
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section B: Book Identity Settings */}
      <section className="space-y-3.5 pt-5 border-t border-stone-300/80" aria-labelledby="section-identity-heading">
        <h2 id="section-identity-heading" className="text-sm font-semibold text-stone-900">
          02. Identitas Publikasi Buku
        </h2>

        <div>
          <label htmlFor="book-title-input" className="block text-xs font-medium text-stone-700 mb-1">
            Judul Buku
          </label>
          <input
            id="book-title-input"
            type="text"
            value={config.title}
            onChange={(e) => onUpdateConfig({ title: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-800"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="book-author-input" className="block text-xs font-medium text-stone-700 mb-1">
              Penulis / Penerbit
            </label>
            <input
              id="book-author-input"
              type="text"
              value={config.author}
              onChange={(e) => onUpdateConfig({ author: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-800"
            />
          </div>
          <div>
            <label htmlFor="book-issue-input" className="block text-xs font-medium text-stone-700 mb-1">
              Edisi / Nomor Katalog
            </label>
            <input
              id="book-issue-input"
              type="text"
              value={config.issueNumber}
              onChange={(e) => onUpdateConfig({ issueNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-800"
            />
          </div>
        </div>

        <div>
          <label htmlFor="book-desc-input" className="block text-xs font-medium text-stone-700 mb-1">
            Deskripsi Singkat
          </label>
          <textarea
            id="book-desc-input"
            rows={2}
            value={config.description}
            onChange={(e) => onUpdateConfig({ description: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-lg text-stone-900 leading-relaxed focus:outline-none focus:border-stone-800"
          />
        </div>
      </section>

      {/* Section C: Access Control & Reader Permissions */}
      <section className="space-y-3 pt-5 border-t border-stone-300/80" aria-labelledby="section-permissions-heading">
        <h2 id="section-permissions-heading" className="text-sm font-semibold text-stone-900">
          03. Kontrol Hak Akses & Fitur Pembaca
        </h2>

        <div className="divide-y divide-stone-200/90 border border-stone-300/80 rounded-lg bg-[#FBF9F5] px-3.5">
          {/* Toggle 1: Allow Download */}
          <label
            htmlFor="toggle-allow-download"
            className="flex items-center justify-between gap-3 py-2.5 cursor-pointer"
          >
            <div>
              <span className="block text-xs font-medium text-stone-900">
                Izinkan Unduh PDF Asli
              </span>
              <span className="block text-[11px] text-stone-500">
                Jika dimatikan, tombol unduh disembunyikan & klik kanan kanvas diblokir
              </span>
            </div>
            <input
              id="toggle-allow-download"
              type="checkbox"
              checked={config.allowDownload}
              onChange={(e) => onUpdateConfig({ allowDownload: e.target.checked })}
              className="w-4 h-4 accent-[#9A3412] rounded cursor-pointer shrink-0"
            />
          </label>

          {/* Toggle 2: Allow Print */}
          <label
            htmlFor="toggle-allow-print"
            className="flex items-center justify-between gap-3 py-2.5 cursor-pointer"
          >
            <div>
              <span className="block text-xs font-medium text-stone-900">
                Izinkan Cetak (Print)
              </span>
              <span className="block text-[11px] text-stone-500">
                Tampilkan tombol cetak halaman pada bilah kontrol pembaca
              </span>
            </div>
            <input
              id="toggle-allow-print"
              type="checkbox"
              checked={config.allowPrint}
              onChange={(e) => onUpdateConfig({ allowPrint: e.target.checked })}
              className="w-4 h-4 accent-[#9A3412] rounded cursor-pointer shrink-0"
            />
          </label>

          {/* Toggle 3: Paper Flip Sound Effect */}
          <label
            htmlFor="toggle-enable-sound"
            className="flex items-center justify-between gap-3 py-2.5 cursor-pointer"
          >
            <div>
              <span className="block text-xs font-medium text-stone-900">
                Efek Suara Lembaran Kertas
              </span>
              <span className="block text-[11px] text-stone-500">
                Sintesis audio gesekan kertas realistis via Web Audio API
              </span>
            </div>
            <input
              id="toggle-enable-sound"
              type="checkbox"
              checked={config.enableSound}
              onChange={(e) => onUpdateConfig({ enableSound: e.target.checked })}
              className="w-4 h-4 accent-[#9A3412] rounded cursor-pointer shrink-0"
            />
          </label>

          {/* Toggle 4: Show Thumbnail / Slider Navigation */}
          <label
            htmlFor="toggle-show-thumbnails"
            className="flex items-center justify-between gap-3 py-2.5 cursor-pointer"
          >
            <div>
              <span className="block text-xs font-medium text-stone-900">
                Navigasi Thumbnail & Slider Halaman
              </span>
              <span className="block text-[11px] text-stone-500">
                Izinkan laci daftar isi bergambar & penggeser halaman cepat
              </span>
            </div>
            <input
              id="toggle-show-thumbnails"
              type="checkbox"
              checked={config.showThumbnails}
              onChange={(e) => onUpdateConfig({ showThumbnails: e.target.checked })}
              className="w-4 h-4 accent-[#9A3412] rounded cursor-pointer shrink-0"
            />
          </label>

          {/* Toggle 5: Optional Password Protection */}
          <div className="py-2.5 space-y-2.5">
            <label
              htmlFor="toggle-password-protect"
              className="flex items-center justify-between gap-3 cursor-pointer"
            >
              <div>
                <span className="block text-xs font-medium text-stone-900">
                  Proteksi Kata Sandi Pembaca
                </span>
                <span className="block text-[11px] text-stone-500">
                  Wajibkan pembaca memasukkan kata sandi sebelum membuka buku
                </span>
              </div>
              <input
                id="toggle-password-protect"
                type="checkbox"
                checked={config.passwordProtected}
                onChange={(e) =>
                  onUpdateConfig({
                    passwordProtected: e.target.checked,
                    password: e.target.checked && !config.password ? 'rahasia2026' : config.password,
                  })
                }
                className="w-4 h-4 accent-[#9A3412] rounded cursor-pointer shrink-0"
              />
            </label>

            {config.passwordProtected && (
              <div className="pt-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Lock
                    className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="book-password-input"
                    aria-label="Kata sandi buku"
                    type="text"
                    value={config.password}
                    onChange={(e) => onUpdateConfig({ password: e.target.value })}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md font-mono-tabular text-stone-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={onLockBookNow}
                  className="px-2.5 py-1.5 text-xs font-medium bg-stone-900 text-white rounded-md hover:bg-stone-800 whitespace-nowrap shrink-0"
                >
                  Uji Kunci
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section D: Shareable Link Generator & Single-File HTML Export */}
      <section className="space-y-3 pt-5 border-t border-stone-300/80" aria-labelledby="section-share-heading">
        <h2 id="section-share-heading" className="text-sm font-semibold text-stone-900">
          04. Generator Tautan Berbagi & Ekspor
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          Tautan di bawah menyimpan konfigurasi identitas dan hak akses secara otomatis (via parameter Hash Base64 & LocalStorage) sehingga langsung terbuka dalam Mode Pembaca.
        </p>

        <div className="flex items-center gap-2">
          <input
            aria-label="Tautan Berbagi Pembaca"
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2 text-xs font-mono-tabular bg-[#FBF9F5] border border-stone-300 rounded-lg text-stone-700 select-all"
          />
          <button
            type="button"
            onClick={handleCopyClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#9A3412] text-white rounded-lg hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Salin URL</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onOpenReaderMode}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium bg-stone-900 text-stone-50 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Buka Mode Pembaca</span>
            <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onOpenStandaloneModal}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium bg-[#FBF9F5] text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-200/70 transition-colors whitespace-nowrap"
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#9A3412]" aria-hidden="true" />
            <span>Kode Single-File HTML</span>
          </button>
        </div>
      </section>
    </aside>
  );
};
