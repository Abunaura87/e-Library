import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Grid,
  Volume2,
  VolumeX,
  Share2,
  Download,
  Printer,
  Lock,
  Unlock,
  Check,
  X,
  SlidersHorizontal,
  Sun,
  Moon,
} from 'lucide-react';
import {
  BookConfig,
  calculateSpreadState,
  verifyBookPassword,
} from '../utils/flipbookLogic';
import { RenderedPageAsset } from '../utils/pdfCanvasRenderer';
import { playPaperFlipSound } from '../utils/paperSound';

interface FlipbookViewer3DProps {
  config: BookConfig;
  pages: RenderedPageAsset[];
  isRendering: boolean;
  renderProgress: { current: number; total: number };
  isReaderOnlyMode: boolean;
  isLocked: boolean;
  onUnlockSuccess: () => void;
  onToggleSound: () => void;
  onToggleTheme: () => void;
  onDownloadPdf: () => void;
  onPrintBook: () => void;
  onCopyShareLink: () => void;
  onToggleCreatorDrawer: () => void;
}

export const FlipbookViewer3D: React.FC<FlipbookViewer3DProps> = ({
  config,
  pages,
  isRendering,
  renderProgress,
  isReaderOnlyMode,
  isLocked,
  onUnlockSuccess,
  onToggleSound,
  onToggleTheme,
  onDownloadPdf,
  onPrintBook,
  onCopyShareLink,
  onToggleCreatorDrawer,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileSingle, setIsMobileSingle] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  );
  const [zoom, setZoom] = useState<number>(1);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
  const [flipAnimKey, setFlipAnimKey] = useState<number>(0);
  const [isThumbDrawerOpen, setIsThumbDrawerOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageInputText, setPageInputText] = useState<string>('1');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [drmNotice, setDrmNotice] = useState<string | null>(null);

  // Drag / Swipe interactive 3D turn state
  const dragStartXRef = useRef<number | null>(null);
  const [dragDeltaX, setDragDeltaX] = useState<number>(0);

  // Password gate state
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const totalPages = Math.max(1, pages.length);
  const spread = calculateSpreadState(currentPage, totalPages, isMobileSingle);

  // Sync responsive spread mode on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileSingle(window.innerWidth < 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clamp page when document changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInputText('1');
  }, [pages.length, config.presetId, config.pdfUrl, config.localFileName]);

  useEffect(() => {
    setPageInputText(String(spread.currentPage));
  }, [spread.currentPage]);

  // Listen to fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const navigateToPage = (targetPage: number, direction?: 'forward' | 'backward') => {
    if (isLocked || isRendering) return;
    const clamped = Math.min(totalPages, Math.max(1, targetPage));
    if (clamped === spread.currentPage) return;

    const dir = direction || (clamped > spread.currentPage ? 'forward' : 'backward');
    setFlipDirection(dir);
    setFlipAnimKey((prev) => prev + 1);
    setCurrentPage(clamped);
    playPaperFlipSound(config.enableSound, dir === 'forward' ? 'next' : 'prev');
  };

  const handlePrevPage = () => {
    if (!spread.canGoPrev) return;
    navigateToPage(spread.prevTargetPage, 'backward');
  };

  const handleNextPage = () => {
    if (!spread.canGoNext) return;
    navigateToPage(spread.nextTargetPage, 'forward');
  };

  // Keyboard Left/Right navigation (ignoring when typing inside an input/textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (spread.canGoNext) {
          navigateToPage(spread.nextTargetPage, 'forward');
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (spread.canGoPrev) {
          navigateToPage(spread.prevTargetPage, 'backward');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Mouse drag & touch swipe on the 3D book surface
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked || isRendering) return;
    dragStartXRef.current = e.clientX;
    setDragDeltaX(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) return;
    const delta = e.clientX - dragStartXRef.current;
    setDragDeltaX(Math.max(-140, Math.min(140, delta)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) return;
    const delta = e.clientX - dragStartXRef.current;
    dragStartXRef.current = null;
    setDragDeltaX(0);

    // Swipe/drag left -> next page; swipe/drag right -> prev page
    if (delta < -42 && spread.canGoNext) {
      handleNextPage();
    } else if (delta > 42 && spread.canGoPrev) {
      handlePrevPage();
    }
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    if (!config.allowDownload) {
      e.preventDefault();
      setDrmNotice('Proteksi Hak Cipta Aktif: Klik kanan dan pengunduhan gambar kanvas dinonaktifkan oleh penerbit.');
      setTimeout(() => setDrmNotice(null), 3000);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInputText, 10);
    if (!Number.isNaN(parsed)) {
      navigateToPage(parsed);
    } else {
      setPageInputText(String(spread.currentPage));
    }
  };

  const handleToggleFullscreen = () => {
    const target = stageRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      target.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = verifyBookPassword(config, passwordInput);
    if (!res.unlocked) {
      setPasswordError(res.error || 'Kata sandi salah.');
      return;
    }
    setPasswordError(null);
    setPasswordInput('');
    onUnlockSuccess();
  };

  const handleShareClick = () => {
    onCopyShareLink();
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2200);
  };

  const isDarkTheme = config.readerTheme === 'dark';

  // Interactive 3D tilt angle while dragging page with cursor/finger
  const liveTiltDeg = dragDeltaX ? (dragDeltaX / 140) * 14 : 0;

  return (
    <section
      ref={stageRef}
      aria-label="Kanvas Pembaca E-Book 3D Flipbook"
      onContextMenu={handleCanvasContextMenu}
      className={`relative flex-1 flex flex-col justify-between overflow-hidden select-none transition-colors duration-200 ${
        isDarkTheme
          ? 'bg-[#141312] text-[#F7F4EE]'
          : 'bg-[#EBE6DF] text-[#1C1917]'
      }`}
    >
      {/* Top Reader Context Strip */}
      <div
        className={`no-print flex items-center justify-between gap-4 px-5 py-3 border-b z-20 ${
          isDarkTheme
            ? 'bg-[#181615]/90 border-stone-800 text-stone-200'
            : 'bg-[#F7F4EE]/90 border-stone-300 text-stone-800'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-stone-400 truncate">
            <span className="font-mono-tabular uppercase tracking-wider truncate">
              {config.issueNumber}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline truncate">{config.author}</span>
            <span aria-hidden="true" className="hidden md:inline">·</span>
            <span className="hidden md:inline font-mono-tabular whitespace-nowrap">
              {isMobileSingle ? '1 Halaman (Single)' : '2 Halaman (Spread)'}
            </span>
          </div>
          <h2 className="text-base md:text-lg font-semibold font-serif-editorial truncate mt-0.5">
            {config.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isReaderOnlyMode && (
            <button
              type="button"
              onClick={onToggleCreatorDrawer}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                isDarkTheme
                  ? 'bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-700'
                  : 'bg-white border-stone-300 text-stone-900 hover:bg-stone-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Buka Panel Admin</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDarkTheme ? 'Ubah ke Tema Kertas Terang' : 'Ubah ke Tema Ruang Baca Gelap'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isDarkTheme
                ? 'bg-stone-800/80 border-stone-700 text-stone-200 hover:bg-stone-700'
                : 'bg-white/80 border-stone-300 text-stone-800 hover:bg-white'
            }`}
          >
            {isDarkTheme ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span className="hidden sm:inline">Kertas Arsip</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-stone-700" aria-hidden="true" />
                <span className="hidden sm:inline">Ruang Gelap</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DRM / Right-Click Protection Notice Toast */}
      {drmNotice && (
        <div
          role="status"
          className="no-print absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-red-950/95 border border-red-700 text-red-100 text-xs font-medium shadow-xl"
        >
          {drmNotice}
        </div>
      )}

      {/* Password Protection Gate Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1C1917] border border-stone-700 rounded-xl p-6 text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#9A3412]/20 border border-[#9A3412]/40 text-[#EA580C]">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[11px] font-mono-tabular uppercase tracking-widest text-stone-400">
                  Dokumen Terproteksi
                </span>
                <h3 className="text-lg font-semibold font-serif-editorial text-white">
                  Masukkan Kata Sandi Publikasi
                </h3>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Penerbit membatasi akses ke katalog <strong>{config.title}</strong>. Masukkan kata sandi resmi untuk membuka pembaca 3D Flipbook.
            </p>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <div>
                <label htmlFor="reader-unlock-password" className="block text-xs text-stone-400 mb-1">
                  Kata Sandi Buku
                </label>
                <input
                  id="reader-unlock-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Ketik kata sandi..."
                  className="w-full px-3.5 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-[#9A3412]"
                />
              </div>

              {passwordError && (
                <p role="alert" className="text-xs text-red-400 font-medium">
                  {passwordError}
                </p>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#9A3412] hover:bg-[#7C2D12] text-white rounded-lg transition-colors"
              >
                <Unlock className="w-4 h-4" aria-hidden="true" />
                <span>Buka Publikasi 3D</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main 3D Flipbook Stage */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-4 md:px-10 overflow-hidden flipbook-perspective-stage">
        {/* Left Floating Quick Turn Arrow */}
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={!spread.canGoPrev || isLocked}
          aria-label="Halaman Sebelumnya"
          className={`no-print hidden sm:flex items-center justify-center w-11 h-11 rounded-full border shadow-lg transition-all z-20 mr-3 md:mr-6 disabled:opacity-25 disabled:pointer-events-none ${
            isDarkTheme
              ? 'bg-[#1C1917]/90 border-stone-700 text-stone-100 hover:bg-stone-800'
              : 'bg-white/90 border-stone-300 text-stone-900 hover:bg-stone-100'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Loading Overlay while PDF.js renders high-DPI pages */}
        {isRendering && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/65 backdrop-blur-xs text-stone-100 p-6"
          >
            <div className="w-56 h-1.5 bg-stone-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-[#9A3412] transition-all duration-200"
                style={{
                  width: `${
                    renderProgress.total > 0
                      ? Math.round((renderProgress.current / renderProgress.total) * 100)
                      : 50
                  }%`,
                }}
              />
            </div>
            <p className="text-sm font-medium font-serif-editorial">
              Merender Kanvas PDF Resolusi Tinggi (Retina DPI)...
            </p>
            <p className="text-xs text-stone-400 font-mono-tabular mt-1">
              Halaman {renderProgress.current} dari {renderProgress.total}
            </p>
          </div>
        )}

        {/* 3D Hardcover Book Object */}
        <div
          data-testid="flipbook-3d-stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            transform: `scale(${zoom}) rotateY(${liveTiltDeg}deg)`,
          }}
          className="flipbook-3d-body relative flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {/* Hardcover Outer Binding & Multi-Page Edge Thickness */}
          <div
            className={`relative flex items-center justify-center rounded-sm p-2 sm:p-3 transition-shadow ${
              isDarkTheme
                ? 'bg-[#26211E] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)]'
                : 'bg-[#3A332C] shadow-[0_28px_56px_-12px_rgba(28,25,23,0.45),0_0_0_1px_rgba(28,25,23,0.2)]'
            }`}
          >
            {/* Left Stacked Paper Thickness Edge */}
            {spread.visiblePages.length === 2 && (
              <div
                aria-hidden="true"
                className="hidden sm:block w-2 self-stretch bg-gradient-to-r from-[#D6CEBE] via-[#F5F2EB] to-[#E5DFD3] border-r border-stone-400/50 rounded-l-xs"
              />
            )}

            {/* Visible Pages Container (1 Page Cover/Mobile or 2-Page Spread) */}
            <div
              key={flipAnimKey}
              className={`relative flex items-center justify-center bg-[#FBF9F5] ${
                flipDirection === 'forward' ? 'page-turn-forward' : 'page-turn-backward'
              }`}
            >
              {spread.visiblePages.map((pageNo, idx) => {
                const asset = pages[pageNo - 1];
                if (!asset) return null;
                const isLeftLeaf = spread.visiblePages.length === 2 && idx === 0;
                const isRightLeaf = spread.visiblePages.length === 2 && idx === 1;

                return (
                  <div
                    key={pageNo}
                    onClick={() => {
                      if (isLeftLeaf && spread.canGoPrev) handlePrevPage();
                      else if (isRightLeaf && spread.canGoNext) handleNextPage();
                      else if (spread.visiblePages.length === 1 && spread.canGoNext) handleNextPage();
                    }}
                    title={
                      isLeftLeaf
                        ? 'Klik atau tarik untuk kembali ke halaman sebelumnya'
                        : 'Klik atau tarik untuk membalik ke halaman berikutnya'
                    }
                    className="relative group overflow-hidden bg-[#FBF9F5]"
                  >
                    <img
                      src={asset.dataUrl}
                      alt={`${config.title} — Halaman ${pageNo}`}
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="block h-[42vh] sm:h-[50vh] lg:h-[56vh] max-h-[520px] w-auto object-contain select-none"
                    />

                    {/* Subtle Page Curl Corner Affordance */}
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute bottom-0 w-8 h-8 transition-all duration-200 opacity-40 group-hover:opacity-90 ${
                        isLeftLeaf
                          ? 'left-0 bg-gradient-to-tr from-stone-400/50 via-stone-200/60 to-transparent'
                          : 'right-0 bg-gradient-to-tl from-stone-400/50 via-stone-200/60 to-transparent'
                      }`}
                    />
                  </div>
                );
              })}

              {/* Center Book Spine Crease & 3D Binding Shadow when in 2-Page Spread */}
              {spread.visiblePages.length === 2 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 bg-gradient-to-r from-transparent via-stone-950/35 to-transparent"
                />
              )}
            </div>

            {/* Right Stacked Paper Thickness Edge */}
            <div
              aria-hidden="true"
              className="hidden sm:block w-2 self-stretch bg-gradient-to-l from-[#D6CEBE] via-[#F5F2EB] to-[#E5DFD3] border-l border-stone-400/50 rounded-r-xs"
            />
          </div>
        </div>

        {/* Right Floating Quick Turn Arrow */}
        <button
          type="button"
          onClick={handleNextPage}
          disabled={!spread.canGoNext || isLocked}
          aria-label="Halaman Berikutnya"
          className={`no-print hidden sm:flex items-center justify-center w-11 h-11 rounded-full border shadow-lg transition-all z-20 ml-3 md:ml-6 disabled:opacity-25 disabled:pointer-events-none ${
            isDarkTheme
              ? 'bg-[#1C1917]/90 border-stone-700 text-stone-100 hover:bg-stone-800'
              : 'bg-white/90 border-stone-300 text-stone-900 hover:bg-stone-100'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Floating Reader Toolbar */}
      <div className="no-print w-full px-4 pb-4 pt-1 flex flex-col items-center gap-2 z-20">
        {/* Optional Page Slider Bar (shown when showThumbnails is enabled in Admin) */}
        {config.showThumbnails && totalPages > 1 && (
          <div
            className={`w-full max-w-4xl flex items-center gap-3 px-4 py-1.5 rounded-lg border text-xs ${
              isDarkTheme
                ? 'bg-[#1C1917]/90 border-stone-800 text-stone-300'
                : 'bg-[#F7F4EE]/95 border-stone-300 text-stone-700'
            }`}
          >
            <span className="font-mono-tabular text-[11px] whitespace-nowrap">
              {spread.label}
            </span>
            <input
              aria-label="Penggeser Navigasi Halaman"
              type="range"
              min={1}
              max={totalPages}
              value={spread.currentPage}
              onChange={(e) => navigateToPage(Number(e.target.value))}
              className="flex-1 h-1.5 accent-[#9A3412] cursor-pointer"
            />
            <span className="font-mono-tabular text-[11px] whitespace-nowrap">
              {spread.progressPercent}%
            </span>
          </div>
        )}

        {/* Primary Floating Control Bar */}
        <div
          role="toolbar"
          aria-label="Kontrol Pembaca Flipbook"
          className={`w-full max-w-4xl rounded-xl border px-3.5 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 ${
            isDarkTheme
              ? 'bg-[#1C1917]/95 border-stone-800 text-stone-100'
              : 'bg-[#FBF9F5]/95 border-stone-300 text-stone-900'
          }`}
        >
          {/* Left Group: Prev / Direct Page Input / Next */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={!spread.canGoPrev || isLocked}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-transparent hover:bg-stone-500/15 disabled:opacity-35 transition-colors whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span>Sebelumnya</span>
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 px-1">
              <label htmlFor="toolbar-page-input" className="sr-only">
                Nomor Halaman
              </label>
              <input
                id="toolbar-page-input"
                type="text"
                inputMode="numeric"
                value={pageInputText}
                onChange={(e) => setPageInputText(e.target.value)}
                onBlur={handlePageInputSubmit}
                className={`w-11 text-center py-1 text-xs font-mono-tabular rounded border ${
                  isDarkTheme
                    ? 'bg-stone-900 border-stone-700 text-white'
                    : 'bg-white border-stone-300 text-stone-900'
                }`}
              />
              <span className="text-xs font-mono-tabular text-stone-400 whitespace-nowrap">
                dari {totalPages}
              </span>
            </form>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={!spread.canGoNext || isLocked}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-transparent hover:bg-stone-500/15 disabled:opacity-35 transition-colors whitespace-nowrap"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Center Group: Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))}
              aria-label="Perkecil Zoom"
              className="p-1.5 rounded-lg hover:bg-stone-500/15 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono-tabular px-1.5 min-w-[46px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
              aria-label="Perbesar Zoom"
              className="p-1.5 rounded-lg hover:bg-stone-500/15 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom !== 1 && (
              <button
                type="button"
                onClick={() => setZoom(1)}
                aria-label="Reset Zoom 100%"
                className="p-1.5 rounded-lg hover:bg-stone-500/15 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Group: Thumbnails, Sound, Print, Download, Share, Fullscreen */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {config.showThumbnails && (
              <button
                type="button"
                onClick={() => setIsThumbDrawerOpen((o) => !o)}
                aria-expanded={isThumbDrawerOpen}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isThumbDrawerOpen
                    ? 'bg-[#9A3412] text-white'
                    : 'hover:bg-stone-500/15'
                }`}
              >
                <Grid className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Daftar Isi</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={config.enableSound ? 'Matikan Suara Kertas' : 'Aktifkan Suara Kertas'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-500/15 transition-colors whitespace-nowrap"
            >
              {config.enableSound ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  <span className="hidden md:inline">Suara Aktif</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                  <span className="hidden md:inline">Bisu</span>
                </>
              )}
            </button>

            {config.allowPrint && (
              <button
                type="button"
                onClick={onPrintBook}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-500/15 transition-colors whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden md:inline">Cetak</span>
              </button>
            )}

            {config.allowDownload && (
              <button
                type="button"
                onClick={onDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#9A3412] text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Unduh PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShareClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-500/15 transition-colors whitespace-nowrap"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Bagikan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              className="p-1.5 rounded-lg hover:bg-stone-500/15 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sliding Drawer Modal: Daftar Isi & Grid Thumbnail Halaman */}
      {config.showThumbnails && isThumbDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Daftar Isi dan Grid Thumbnail Halaman"
          className="no-print absolute inset-y-0 right-0 z-30 w-full max-w-md bg-[#1C1917] border-l border-stone-700 text-stone-100 shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
            <div>
              <h3 className="text-sm font-semibold font-serif-editorial">
                Daftar Isi & Navigasi Halaman ({totalPages} Halaman)
              </h3>
              <p className="text-xs text-stone-400">
                Pilih halaman untuk langsung membuka lembaran terkait.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsThumbDrawerOpen(false)}
              aria-label="Tutup Daftar Isi"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-4">
            {pages.map((p) => {
              const isCurrent = spread.visiblePages.includes(p.pageNumber);
              return (
                <button
                  key={p.pageNumber}
                  type="button"
                  onClick={() => {
                    navigateToPage(p.pageNumber);
                    setIsThumbDrawerOpen(false);
                  }}
                  className={`group flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    isCurrent
                      ? 'bg-[#9A3412]/15 border-[#9A3412] ring-1 ring-[#9A3412]'
                      : 'bg-stone-900/70 border-stone-800 hover:border-stone-600'
                  }`}
                >
                  <div className="w-full aspect-[3/4] bg-stone-950 rounded overflow-hidden mb-2 border border-stone-800">
                    <img
                      src={p.thumbnailUrl}
                      alt={`Thumbnail Halaman ${p.pageNumber}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain group-hover:scale-103 transition-transform"
                    />
                  </div>
                  <span className="text-[11px] font-mono-tabular text-stone-400">
                    Halaman {p.pageNumber}
                  </span>
                  <span className="text-xs font-medium text-stone-100 line-clamp-1 mt-0.5">
                    {p.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
