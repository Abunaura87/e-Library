import React, { useEffect, useState, useCallback } from 'react';
import {
  BookConfig,
  DEFAULT_BOOK_CONFIG,
  PresetEdition,
  PRESET_EDITIONS,
  encodeShareConfig,
  decodeShareConfig,
} from './utils/flipbookLogic';
import {
  RenderedPageAsset,
  renderPdfBinaryWithPdfJs,
  renderPresetBookBundle,
} from './utils/pdfCanvasRenderer';
import { CreatorSidebar } from './components/CreatorSidebar';
import { FlipbookViewer3D } from './components/FlipbookViewer3D';
import { StandaloneCodeModal } from './components/StandaloneCodeModal';

const STORAGE_KEY = 'folio3d_publisher_config_v1';

export default function App() {
  // Initialize state from URL hash (#mode=reader&cfg=...) or localStorage or Default
  const [config, setConfig] = useState<BookConfig>(() => {
    if (typeof window !== 'undefined') {
      const fromHash = decodeShareConfig(window.location.hash);
      if (fromHash) return fromHash;

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.title === 'string') {
            return { ...DEFAULT_BOOK_CONFIG, ...parsed };
          }
        }
      } catch {
        // Ignore storage parse error
      }
    }
    return DEFAULT_BOOK_CONFIG;
  });

  // View mode: 'split' (Creator Studio + Live 3D Viewer) or 'reader' (Full Reader Mode)
  const [viewMode, setViewMode] = useState<'split' | 'reader'>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('mode=reader')) {
      return 'reader';
    }
    return 'split';
  });

  const [pages, setPages] = useState<RenderedPageAsset[]>([]);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [renderProgress, setRenderProgress] = useState<{ current: number; total: number }>({
    current: 1,
    total: 8,
  });
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('mode=reader')) {
      const decoded = decodeShareConfig(window.location.hash);
      if (decoded?.passwordProtected && decoded.password) return true;
    }
    return false;
  });
  const [isStandaloneModalOpen, setIsStandaloneModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Persist config changes to localStorage and update URL hash softly
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage quota errors
    }
  }, [config]);

  // Render Preset Edition whenever presetId or identity changes (if source is preset)
  useEffect(() => {
    if (config.pdfSourceType !== 'preset') return;
    let cancelled = false;

    setIsRendering(true);
    setRenderError(null);

    renderPresetBookBundle(config, (current, total) => {
      if (!cancelled) setRenderProgress({ current, total });
    })
      .then((bundle) => {
        if (cancelled) return;
        setPages(bundle.pages);
        setPdfBytes(bundle.pdfBytes);
        setIsRendering(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setRenderError(err instanceof Error ? err.message : 'Gagal merender halaman buku.');
        setIsRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    config.pdfSourceType,
    config.presetId,
    config.title,
    config.author,
    config.description,
    config.issueNumber,
    config.publishedDate,
  ]);

  // Handle updates to BookConfig
  const handleUpdateConfig = (partial: Partial<BookConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  // Handle selecting one of the 3 curated sample editions
  const handleSelectPreset = (presetId: PresetEdition['id']) => {
    const preset = PRESET_EDITIONS[presetId];
    setRenderError(null);
    setConfig((prev) => ({
      ...prev,
      pdfSourceType: 'preset',
      presetId,
      localFileName: undefined,
      title: preset.title,
      author: preset.author,
      issueNumber: preset.issueNumber,
      description: preset.description,
    }));
  };

  // Handle uploading a local PDF file via File Picker or Drag & Drop
  const handleUploadLocalPdf = async (file: File) => {
    setIsRendering(true);
    setRenderError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const rawBytes = new Uint8Array(arrayBuffer);
      const renderedPages = await renderPdfBinaryWithPdfJs(
        { data: rawBytes },
        (current, total) => setRenderProgress({ current, total })
      );
      const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ');
      setPages(renderedPages);
      setPdfBytes(rawBytes);
      setConfig((prev) => ({
        ...prev,
        pdfSourceType: 'local',
        localFileName: file.name,
        title: cleanTitle || prev.title,
      }));
      showToast(`Berhasil merender ${renderedPages.length} halaman dari "${file.name}"`);
    } catch (err) {
      setRenderError(
        err instanceof Error
          ? `Berkas PDF rusak atau tidak dapat dibaca: ${err.message}`
          : 'Berkas PDF rusak atau tidak valid.'
      );
    } finally {
      setIsRendering(false);
    }
  };

  // Handle loading a direct PDF URL via PDF.js
  const handleLoadPdfUrl = async (url: string) => {
    setIsRendering(true);
    setRenderError(null);
    try {
      const renderedPages = await renderPdfBinaryWithPdfJs(
        { url },
        (current, total) => setRenderProgress({ current, total })
      );
      setPages(renderedPages);
      setConfig((prev) => ({
        ...prev,
        pdfSourceType: 'url',
        pdfUrl: url,
        localFileName: undefined,
      }));
      showToast(`Berhasil memuat ${renderedPages.length} halaman dari URL PDF`);
    } catch (err) {
      setRenderError(
        err instanceof Error
          ? `Gagal memuat URL PDF (pastikan URL publik mengizinkan CORS & mengarah ke file .pdf valid): ${err.message}`
          : 'Tautan PDF tidak dapat diakses atau terhalang kebijakan CORS.'
      );
    } finally {
      setIsRendering(false);
    }
  };

  // Shareable Reader Link construction
  const shareToken = encodeShareConfig(config);
  const baseOrigin =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://folio3d.app/';
  const shareUrl = `${baseOrigin}#mode=reader&cfg=${shareToken}`;

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#mode=reader&cfg=${shareToken}`);
      navigator.clipboard?.writeText(shareUrl).catch(() => {});
    }
    showToast('Tautan baca dengan konfigurasi berhasil disalin ke papan klip.');
  };

  const handleDownloadPdf = () => {
    if (!config.allowDownload) return;
    if (config.pdfSourceType === 'url' && config.pdfUrl) {
      const a = document.createElement('a');
      a.href = config.pdfUrl;
      a.download = `${config.title || 'publikasi'}.pdf`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (pdfBytes) {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug = (config.title || 'katalog-3d')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      a.href = url;
      a.download = `${slug || 'katalog'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Mengunduh dokumen PDF asli...');
    }
  };

  const handlePrintBook = () => {
    if (!config.allowPrint) return;
    window.print();
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F7F4EE] text-[#1C1917]">
      {/* Strict 3-Zone Top Navigation Bar following Universal Design Constitution */}
      <header className="no-print shrink-0 flex items-center justify-between gap-8 px-6 py-3 border-b border-stone-300 bg-[#FBF9F5]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setViewMode('split');
          }}
          className="text-lg font-bold tracking-tight font-serif-editorial text-stone-900 whitespace-nowrap shrink-0"
        >
          Folio3D
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600"
        >
          <a
            href="#studio"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('split');
            }}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'split' ? 'text-stone-950 underline underline-offset-8 decoration-2 decoration-[#9A3412]' : ''
            }`}
          >
            Studio Penerbit
          </a>
          <a
            href="#reader"
            onClick={(e) => {
              e.preventDefault();
              if (config.passwordProtected && config.password) {
                setIsLocked(true);
              }
              setViewMode('reader');
            }}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'reader' ? 'text-stone-950 underline underline-offset-8 decoration-2 decoration-[#9A3412]' : ''
            }`}
          >
            Pembaca 3D Penuh
          </a>
          <a
            href="#katalog-sampel"
            onClick={(e) => {
              e.preventDefault();
              const nextPreset =
                config.presetId === 'arch-light'
                  ? 'botanical-atlas'
                  : config.presetId === 'botanical-atlas'
                  ? 'typo-manifesto'
                  : 'arch-light';
              handleSelectPreset(nextPreset);
            }}
            className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
          >
            Ganti Edisi Sampel
          </a>
          <a
            href="#single-file-html"
            onClick={(e) => {
              e.preventDefault();
              setIsStandaloneModalOpen(true);
            }}
            className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
          >
            Kode Single-File HTML
          </a>
        </nav>

        {/* Zone 3: 1 primary CTA button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="px-4 py-2 text-xs font-medium text-white bg-[#9A3412] rounded-lg hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0"
          >
            Salin Tautan Baca
          </button>
        </div>
      </header>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-20 right-6 z-50 px-4 py-2.5 rounded-lg bg-stone-900 text-stone-50 border border-stone-700 text-xs font-medium shadow-xl"
        >
          {toastMessage}
        </div>
      )}

      {/* Main Workspace Container */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {viewMode === 'split' && (
          <CreatorSidebar
            config={config}
            shareUrl={shareUrl}
            isRendering={isRendering}
            renderError={renderError}
            onUpdateConfig={handleUpdateConfig}
            onSelectPreset={handleSelectPreset}
            onUploadLocalPdf={handleUploadLocalPdf}
            onLoadPdfUrl={handleLoadPdfUrl}
            onCopyShareLink={handleCopyShareLink}
            onOpenReaderMode={() => {
              if (config.passwordProtected && config.password) {
                setIsLocked(true);
              }
              setViewMode('reader');
            }}
            onLockBookNow={() => {
              setIsLocked(true);
              showToast('Layar kunci kata sandi diaktifkan pada kanvas pembaca.');
            }}
            onOpenStandaloneModal={() => setIsStandaloneModalOpen(true)}
          />
        )}

        <FlipbookViewer3D
          config={config}
          pages={pages}
          isRendering={isRendering}
          renderProgress={renderProgress}
          isReaderOnlyMode={viewMode === 'reader'}
          isLocked={isLocked}
          onUnlockSuccess={() => {
            setIsLocked(false);
            showToast('Kata sandi benar. Selamat membaca!');
          }}
          onToggleSound={() => handleUpdateConfig({ enableSound: !config.enableSound })}
          onToggleTheme={() =>
            handleUpdateConfig({
              readerTheme: config.readerTheme === 'dark' ? 'archival' : 'dark',
            })
          }
          onDownloadPdf={handleDownloadPdf}
          onPrintBook={handlePrintBook}
          onCopyShareLink={handleCopyShareLink}
          onToggleCreatorDrawer={() => setViewMode('split')}
        />
      </main>

      {/* Modal for inspecting/copying/downloading the complete Single-File HTML */}
      <StandaloneCodeModal
        isOpen={isStandaloneModalOpen}
        config={config}
        onClose={() => setIsStandaloneModalOpen(false)}
      />
    </div>
  );
}
