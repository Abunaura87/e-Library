import { BookConfig, PRESET_EDITIONS } from './flipbookLogic';

/**
 * Generates a complete, self-contained Single-File HTML string combining HTML5,
 * Tailwind CSS CDN, PDF.js CDN, StPageFlip CDN, Lucide Icons CDN, and Vanilla JS.
 * Pre-configured with the user's current BookConfig so it runs immediately in any modern browser.
 */
export function buildStandaloneSingleFileHtml(config: BookConfig): string {
  const preset = PRESET_EDITIONS[config.presetId] || PRESET_EDITIONS['arch-light'];
  const serializedConfig = JSON.stringify(config, null, 2);
  const serializedPresets = JSON.stringify(PRESET_EDITIONS, null, 2);

  return `<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.title)} — Interactive 3D Flipbook Reader & Publisher</title>
  <!-- 1. Pustaka Eksternal via CDN Resmi -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/lucide@latest" crossorigin="anonymous"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --font-display: 'Fraunces', Georgia, serif;
      --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    body {
      font-family: var(--font-sans);
    }
    .font-serif-editorial {
      font-family: var(--font-display);
    }
    .font-mono-tabular {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }
    /* 3D Flipbook Perspective & Page Turn Physics */
    .flipbook-stage {
      perspective: 2200px;
    }
    .book-3d-shell {
      transform-style: preserve-3d;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow:
        0 30px 60px -15px rgba(0, 0, 0, 0.55),
        0 0 0 1px rgba(255, 255, 255, 0.08);
    }
    .page-leaf-turn-next {
      animation: pageFlipNext 0.52s cubic-bezier(0.22, 1, 0.36, 1);
      transform-origin: left center;
    }
    .page-leaf-turn-prev {
      animation: pageFlipPrev 0.52s cubic-bezier(0.22, 1, 0.36, 1);
      transform-origin: right center;
    }
    @keyframes pageFlipNext {
      0% { transform: rotateY(-28deg) scale(0.985); filter: brightness(0.92); }
      100% { transform: rotateY(0deg) scale(1); filter: brightness(1); }
    }
    @keyframes pageFlipPrev {
      0% { transform: rotateY(28deg) scale(0.985); filter: brightness(0.92); }
      100% { transform: rotateY(0deg) scale(1); filter: brightness(1); }
    }
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="h-full bg-[#141312] text-[#F7F4EE] antialiased selection:bg-[#9A3412]/30">
  <div id="app" class="min-h-screen flex flex-col">
    <!-- Top Navigation Bar -->
    <header class="no-print flex items-center justify-between gap-8 px-6 py-3.5 border-b border-stone-800 bg-[#181615]">
      <a href="#top" class="text-lg font-bold tracking-tight font-serif-editorial text-stone-100 whitespace-nowrap shrink-0">
        Folio3D Studio
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-stone-400">
        <button id="nav-btn-admin" type="button" class="hover:text-white transition-colors whitespace-nowrap shrink-0">Dashboard Penerbit</button>
        <button id="nav-btn-reader" type="button" class="hover:text-white transition-colors whitespace-nowrap shrink-0">Pembaca 3D</button>
        <button id="nav-btn-thumbs" type="button" class="hover:text-white transition-colors whitespace-nowrap shrink-0">Daftar Halaman</button>
        <button id="nav-btn-theme" type="button" class="hover:text-white transition-colors whitespace-nowrap shrink-0">Tema Kanvas</button>
      </nav>
      <div class="flex items-center gap-3 shrink-0">
        <button id="btn-copy-share" type="button" class="px-4 py-2 text-xs font-medium text-white bg-[#9A3412] rounded-lg hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0">
          Salin Tautan Baca
        </button>
      </div>
    </header>

    <!-- Main Workspace Split -->
    <main class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Column: Admin Creator Panel -->
      <aside id="admin-panel" class="no-print w-full lg:w-[400px] xl:w-[430px] border-r border-stone-800 bg-[#1C1917] overflow-y-auto p-6 space-y-6">
        <div>
          <h1 class="text-lg font-semibold font-serif-editorial text-stone-100">Panel Kendali Penerbit</h1>
          <p class="text-xs text-stone-400 mt-1">Unggah dokumen PDF atau atur hak akses pembaca secara langsung.</p>
        </div>

        <!-- Upload PDF Dropzone -->
        <div class="space-y-3">
          <label class="block text-xs font-medium text-stone-300">Sumber Dokumen PDF</label>
          <label for="pdf-file-input" class="flex flex-col items-center justify-center p-5 border border-dashed border-stone-700 rounded-lg bg-stone-900/60 hover:border-stone-500 cursor-pointer transition-colors text-center">
            <span class="text-xs font-medium text-stone-200">Klik atau Tarik File PDF Lokal ke Sini</span>
            <span id="file-status-label" class="text-[11px] text-stone-400 mt-1">Mendukung PDF resolusi tinggi (Retina DPI)</span>
            <input id="pdf-file-input" type="file" accept="application/pdf" class="sr-only" />
          </label>
          <div class="flex gap-2">
            <input id="pdf-url-input" type="url" placeholder="Atau tempel URL PDF langsung (https://...)" class="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500" />
            <button id="btn-load-url" type="button" class="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-medium rounded-lg whitespace-nowrap shrink-0">Muat URL</button>
          </div>
        </div>

        <!-- Book Identity -->
        <div class="space-y-3 pt-4 border-t border-stone-800">
          <h2 class="text-xs font-semibold text-stone-300">Identitas Buku</h2>
          <div>
            <label for="inp-title" class="block text-[11px] text-stone-400 mb-1">Judul Buku</label>
            <input id="inp-title" type="text" class="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100" />
          </div>
          <div>
            <label for="inp-author" class="block text-[11px] text-stone-400 mb-1">Penulis / Penerbit</label>
            <input id="inp-author" type="text" class="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100" />
          </div>
          <div>
            <label for="inp-desc" class="block text-[11px] text-stone-400 mb-1">Deskripsi Singkat</label>
            <textarea id="inp-desc" rows="2" class="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"></textarea>
          </div>
        </div>

        <!-- Permissions & Reader Features -->
        <div class="space-y-3 pt-4 border-t border-stone-800">
          <h2 class="text-xs font-semibold text-stone-300">Hak Akses & Fitur Pembaca</h2>
          <label class="flex items-center justify-between text-xs text-stone-300 cursor-pointer py-1">
            <span>Izinkan Unduh PDF Asli</span>
            <input id="chk-download" type="checkbox" class="accent-[#9A3412] w-4 h-4" />
          </label>
          <label class="flex items-center justify-between text-xs text-stone-300 cursor-pointer py-1">
            <span>Izinkan Cetak (Print)</span>
            <input id="chk-print" type="checkbox" class="accent-[#9A3412] w-4 h-4" />
          </label>
          <label class="flex items-center justify-between text-xs text-stone-300 cursor-pointer py-1">
            <span>Efek Suara Lembaran Kertas</span>
            <input id="chk-sound" type="checkbox" class="accent-[#9A3412] w-4 h-4" />
          </label>
          <label class="flex items-center justify-between text-xs text-stone-300 cursor-pointer py-1">
            <span>Tampilkan Navigasi Thumbnail</span>
            <input id="chk-thumbs" type="checkbox" class="accent-[#9A3412] w-4 h-4" />
          </label>
          <label class="flex items-center justify-between text-xs text-stone-300 cursor-pointer py-1">
            <span>Proteksi Kata Sandi</span>
            <input id="chk-password" type="checkbox" class="accent-[#9A3412] w-4 h-4" />
          </label>
          <div id="password-box" class="hidden pt-1">
            <input id="inp-password" type="text" placeholder="Kata sandi buka buku..." class="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100" />
          </div>
        </div>
      </aside>

      <!-- Right Column: 3D Flipbook Reader Viewport -->
      <section id="reader-stage" class="flex-1 relative flex flex-col items-center justify-between p-4 md:p-8 overflow-hidden select-none">
        <!-- Book Header Info -->
        <div class="w-full max-w-5xl flex items-center justify-between gap-4 z-10">
          <div>
            <h2 id="reader-title" class="text-base md:text-lg font-semibold font-serif-editorial">${escapeHtml(config.title)}</h2>
            <p id="reader-meta" class="text-xs text-stone-400">${escapeHtml(config.author)} · <span id="page-indicator-top" class="font-mono-tabular">Halaman 1</span></p>
          </div>
          <div id="toast-banner" class="hidden text-xs px-3 py-1.5 rounded bg-stone-800 text-stone-100 border border-stone-700"></div>
        </div>

        <!-- 3D Book Container -->
        <div id="flipbook-viewport" class="flipbook-stage my-auto flex items-center justify-center w-full py-4">
          <div id="book-shell" class="book-3d-shell relative flex items-center justify-center rounded-sm bg-[#231F1D] p-2 md:p-3">
            <div id="pages-wrapper" class="relative flex items-center justify-center"></div>
            <div id="spine-overlay" class="pointer-events-none absolute inset-y-2 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-transparent via-black/45 to-transparent"></div>
          </div>
        </div>

        <!-- Floating Reader Toolbar -->
        <div class="no-print w-full max-w-3xl bg-[#1C1917]/95 border border-stone-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10 shadow-2xl">
          <div class="flex items-center gap-2">
            <button id="btn-prev" type="button" class="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium">Sebelumnya</button>
            <span id="toolbar-page-label" class="text-xs font-mono-tabular px-2 text-stone-300">1 / ${preset.chapters.length}</span>
            <button id="btn-next" type="button" class="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium">Berikutnya</button>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-zoom-out" type="button" class="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs">-</button>
            <span id="zoom-label" class="text-xs font-mono-tabular text-stone-300">100%</span>
            <button id="btn-zoom-in" type="button" class="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs">+</button>
            <button id="btn-sound-toggle" type="button" class="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs">Suara</button>
            <button id="btn-print" type="button" class="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs">Cetak</button>
            <button id="btn-download" type="button" class="px-3 py-1.5 rounded-lg bg-[#9A3412] hover:bg-[#7C2D12] text-white text-xs font-medium">Unduh PDF</button>
            <button id="btn-fullscreen" type="button" class="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs">Layar Penuh</button>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    // Konfigurasi awal & Edisi Kuratorial Bawaan
    const INITIAL_CONFIG = ${serializedConfig};
    const PRESETS = ${serializedPresets};
    let state = Object.assign({}, INITIAL_CONFIG);
    let currentPage = 1;
    let zoomLevel = 1;
    let renderedCanvases = [];

    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    function playFlipAudio() {
      if (!state.enableSound) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const dur = 0.2;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / data.length;
          data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * (1 - t);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        const gain = ctx.createGain();
        gain.gain.value = 0.2;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start();
      } catch (e) {}
    }

    function renderPresetPages() {
      const preset = PRESETS[state.presetId] || PRESETS['arch-light'];
      const dpr = Math.min(window.devicePixelRatio || 2, 2);
      renderedCanvases = preset.chapters.map((ch, idx) => {
        const c = document.createElement('canvas');
        c.width = 520 * dpr;
        c.height = 720 * dpr;
        const ctx = c.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.fillStyle = idx === 0 ? preset.coverTint : '#FBF9F5';
        ctx.fillRect(0, 0, 520, 720);
        ctx.fillStyle = idx === 0 ? '#FBF9F5' : '#1C1917';
        ctx.font = '600 22px Fraunces, serif';
        ctx.fillText(ch.title.slice(0, 34), 42, 110);
        ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = idx === 0 ? '#D6CEBE' : '#57534E';
        ctx.fillText(ch.subtitle.slice(0, 54), 42, 142);
        ch.bodyParagraphs.forEach((p, pIdx) => {
          ctx.fillText(p.slice(0, 68), 42, 210 + pIdx * 40);
        });
        return c.toDataURL('image/jpeg', 0.9);
      });
      updateReaderView('next');
    }

    function updateReaderView(dir) {
      const wrapper = document.getElementById('pages-wrapper');
      wrapper.innerHTML = '';
      const total = renderedCanvases.length || 1;
      const isSpread = window.innerWidth >= 900 && currentPage > 1;
      const pagesToShow = isSpread
        ? [currentPage % 2 === 0 ? currentPage : currentPage - 1, (currentPage % 2 === 0 ? currentPage : currentPage - 1) + 1].filter(p => p <= total)
        : [currentPage];

      pagesToShow.forEach((pNo) => {
        const img = document.createElement('img');
        img.src = renderedCanvases[pNo - 1];
        img.alt = 'Halaman ' + pNo;
        img.className = 'h-[460px] md:h-[560px] w-auto object-contain bg-white shadow-md ' + (dir === 'next' ? 'page-leaf-turn-next' : 'page-leaf-turn-prev');
        if (!state.allowDownload) {
          img.oncontextmenu = (e) => e.preventDefault();
        }
        wrapper.appendChild(img);
      });

      document.getElementById('spine-overlay').style.display = pagesToShow.length > 1 ? 'block' : 'none';
      document.getElementById('book-shell').style.transform = 'scale(' + zoomLevel + ')';
      document.getElementById('reader-title').textContent = state.title;
      document.getElementById('reader-meta').textContent = state.author + ' · Halaman ' + pagesToShow.join('–') + ' dari ' + total;
      document.getElementById('toolbar-page-label').textContent = pagesToShow.join('–') + ' / ' + total;
      document.getElementById('btn-download').style.display = state.allowDownload ? 'inline-flex' : 'none';
      document.getElementById('btn-print').style.display = state.allowPrint ? 'inline-flex' : 'none';
    }

    document.getElementById('btn-prev').onclick = () => {
      if (currentPage > 1) {
        currentPage = Math.max(1, currentPage - (window.innerWidth >= 900 && currentPage > 2 ? 2 : 1));
        playFlipAudio();
        updateReaderView('prev');
      }
    };
    document.getElementById('btn-next').onclick = () => {
      if (currentPage < renderedCanvases.length) {
        currentPage = Math.min(renderedCanvases.length, currentPage + (window.innerWidth >= 900 && currentPage >= 2 ? 2 : 1));
        playFlipAudio();
        updateReaderView('next');
      }
    };
    document.getElementById('btn-zoom-in').onclick = () => { zoomLevel = Math.min(1.5, +(zoomLevel + 0.15).toFixed(2)); document.getElementById('zoom-label').textContent = Math.round(zoomLevel * 100) + '%'; updateReaderView('next'); };
    document.getElementById('btn-zoom-out').onclick = () => { zoomLevel = Math.max(0.7, +(zoomLevel - 0.15).toFixed(2)); document.getElementById('zoom-label').textContent = Math.round(zoomLevel * 100) + '%'; updateReaderView('next'); };
    document.getElementById('btn-print').onclick = () => { if (state.allowPrint) window.print(); };
    document.getElementById('btn-fullscreen').onclick = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    };

    // Sync inputs
    const inpTitle = document.getElementById('inp-title');
    const inpAuthor = document.getElementById('inp-author');
    const inpDesc = document.getElementById('inp-desc');
    inpTitle.value = state.title;
    inpAuthor.value = state.author;
    inpDesc.value = state.description;
    document.getElementById('chk-download').checked = state.allowDownload;
    document.getElementById('chk-print').checked = state.allowPrint;
    document.getElementById('chk-sound').checked = state.enableSound;
    document.getElementById('chk-thumbs').checked = state.showThumbnails;
    document.getElementById('chk-password').checked = state.passwordProtected;

    inpTitle.oninput = (e) => { state.title = e.target.value; updateReaderView('next'); };
    inpAuthor.oninput = (e) => { state.author = e.target.value; updateReaderView('next'); };
    inpDesc.oninput = (e) => { state.description = e.target.value; };
    document.getElementById('chk-download').onchange = (e) => { state.allowDownload = e.target.checked; updateReaderView('next'); };
    document.getElementById('chk-print').onchange = (e) => { state.allowPrint = e.target.checked; updateReaderView('next'); };
    document.getElementById('chk-sound').onchange = (e) => { state.enableSound = e.target.checked; };

    renderPresetPages();
    if (window.lucide) window.lucide.createIcons();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
