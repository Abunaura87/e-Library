export interface BookChapter {
  title: string;
  subtitle: string;
  pageNumber: number;
  kicker: string;
  bodyParagraphs: string[];
  pullQuote?: string;
  figureCaption?: string;
  accentColor: string;
}

export interface BookConfig {
  id: string;
  title: string;
  author: string;
  description: string;
  issueNumber: string;
  publishedDate: string;
  pdfSourceType: 'preset' | 'local' | 'url';
  presetId: 'arch-light' | 'botanical-atlas' | 'typo-manifesto';
  pdfUrl: string;
  localFileName?: string;
  allowDownload: boolean;
  allowPrint: boolean;
  enableSound: boolean;
  showThumbnails: boolean;
  passwordProtected: boolean;
  password: string;
  readerTheme: 'archival' | 'dark';
}

export const DEFAULT_BOOK_CONFIG: BookConfig = {
  id: 'folio-arch-2026',
  title: 'Arsitektur Cahaya & Ruang Nusantara',
  author: 'Studio Kuratorial Atelier Meridien',
  description:
    'Monografi edisi koleksi mengenai dialog antara struktur tropis vernakular, pencahayaan alami, dan tektonika beton kontemporer di Asia Tenggara.',
  issueNumber: 'VOL. XIV · MONOGRAFI KURATORIAL',
  publishedDate: 'Oktober 2026',
  pdfSourceType: 'preset',
  presetId: 'arch-light',
  pdfUrl: '',
  allowDownload: true,
  allowPrint: true,
  enableSound: true,
  showThumbnails: true,
  passwordProtected: false,
  password: '',
  readerTheme: 'dark',
};

export interface PresetEdition {
  id: 'arch-light' | 'botanical-atlas' | 'typo-manifesto';
  title: string;
  author: string;
  issueNumber: string;
  description: string;
  coverTint: string;
  accentHex: string;
  chapters: BookChapter[];
}

export const PRESET_EDITIONS: Record<PresetEdition['id'], PresetEdition> = {
  'arch-light': {
    id: 'arch-light',
    title: 'Arsitektur Cahaya & Ruang Nusantara',
    author: 'Studio Kuratorial Atelier Meridien',
    issueNumber: 'VOL. XIV · MONOGRAFI ARSITEKTUR',
    description:
      'Monografi edisi koleksi mengenai dialog antara struktur tropis vernakular, pencahayaan alami, dan tektonika beton kontemporer di Asia Tenggara.',
    coverTint: '#1C1917',
    accentHex: '#9A3412',
    chapters: [
      {
        pageNumber: 1,
        kicker: 'SAMPUL DEPAN · EDISI KOLEKTOR',
        title: 'Arsitektur Cahaya & Ruang Nusantara',
        subtitle: 'Dialog Antara Bayangan Tropis, Void, dan Materialitas Jujur',
        bodyParagraphs: [
          'Katalog Pameran Tahunan & Dokumentasi Tektonik Asia Tenggara.',
          'Diterbitkan oleh Studio Kuratorial Atelier Meridien · Jakarta & Kyoto.',
        ],
        figureCaption: 'No. Katalog ACC.2026.04.18 · Cetakan Pertama',
        accentColor: '#9A3412',
      },
      {
        pageNumber: 2,
        kicker: '01 / PENGANTAR KURATORIAL',
        title: 'Cahaya Sebagai Elemen Struktural Utama',
        subtitle: 'Membaca ulang batas antara interior terlindung dan lanskap terbuka',
        bodyParagraphs: [
          'Selama pergeseran arsitektur pertengahan abad, cahaya matahari khatulistiwa tidak lagi diperlakukan sekadar sebagai penerang pasif, melainkan sebagai instrumen struktural aktif yang membentuk batas volumetrik ruang.',
          'Pada iklim tropis lembap, atap berteritis lebar dan kisi-kisi kayu ulin menyaring radiasi vertikal menjadi pendaran lembut yang bergerak mengikuti rotasi harian bumi.',
        ],
        pullQuote:
          '“Ruang baru benar-benar hadir ketika seberkas cahaya menyentuh permukaan batu dan menciptakan keheningan.”',
        figureCaption: 'Gambar 1.1 — Studi proporsi bukaan atrium selatan (Skala 1:50).',
        accentColor: '#9A3412',
      },
      {
        pageNumber: 3,
        kicker: '02 / TEKTONIKA MATERIAL',
        title: 'Kejujuran Beton Ekspos & Kayu Reklamasi',
        subtitle: 'Patinasi alami terhadap kelembapan dan hujan monsun',
        bodyParagraphs: [
          'Permukaan beton cor di tempat (board-formed concrete) menyimpan jejak serat papan kayu cetakannya. Ketika disandingkan dengan balok jati tua, tercipta keseimbangan suhu visual antara dinginnya batu buatan dan hangatnya serat organik.',
          'Setiap sambungan struktur dirancang tampak secara jujur tanpa pelapis sintetis, membiarkan waktu menuliskan karakter pada fasad bangunan.',
        ],
        figureCaption: 'Gambar 2.4 — Detail sambungan kolom baja corten dan balok kayu laminasi.',
        accentColor: '#78350F',
      },
      {
        pageNumber: 4,
        kicker: '03 / SIRKULASI UDARA & VOID',
        title: 'Halaman Dalam Sebagai Paru-Paru Bangunan',
        subtitle: 'Ventilasi silang pasif tanpa ketergantungan mekanis',
        bodyParagraphs: [
          'Penempatan kolam reflektif di sisi angin datang menurunkan suhu mikro udara hingga 3,4 derajat Celsius sebelum mengalir melintasi ruang baca utama.',
          'Void vertikal setinggi dua belas meter bekerja layaknya cerobong termal, menarik udara hangat ke atas dan melepaskannya melalui celah lantern atap.',
        ],
        pullQuote:
          '“Arsitektur tropis yang bijak tidak melawan iklim, melainkan menari bersama arah angin dan jatuhnya air hujan.”',
        figureCaption: 'Gambar 3.2 — Diagram potongan aliran konveksi termal pada bangunan utama.',
        accentColor: '#1E3A8A',
      },
      {
        pageNumber: 5,
        kicker: '04 / STUDI KASUS PAVILIUN',
        title: 'Paviliun Kontemplasi Lembah Ubud',
        subtitle: 'Struktur kantilever bambu hitam dan fondasi batu kali lokal',
        bodyParagraphs: [
          'Berdiri di atas kontur lereng curam dengan kemiringan empat puluh derajat, struktur paviliun ini bertumpu hanya pada enam titik fondasi batu kali untuk menjaga keutuhan sistem akar pohon eksisting.',
          'Bentang atap lengkung sepanjang delapan belas meter dirakit menggunakan sistem pasak tradisional tanpa paku logam tunggal.',
        ],
        figureCaption: 'Gambar 4.1 — Tampak timur paviliun saat kabut pagi menyelimuti lembah.',
        accentColor: '#14532D',
      },
      {
        pageNumber: 6,
        kicker: '05 / TIPOLOGI RUANG BACA',
        title: 'Perpustakaan Cahaya Utara & Arsip Kertas',
        subtitle: 'Konservasi naskah melalui pengendalian luminansi tidak langsung',
        bodyParagraphs: [
          'Koleksi naskah langka menuntut pencahayaan stabil di bawah 150 lux tanpa paparan sinar ultraviolet langsung. Sirip-sirip aluminium anodized memantulkan cahaya langit utara ke langit-langit lengkung gipsum.',
          'Hasilnya adalah medan terang yang merata tanpa bayangan tajam di atas meja baca sepanjang hari.',
        ],
        pullQuote:
          '“Perpustakaan adalah instrumen optik tempat pikiran manusia bertemu dengan memori kolektif yang tercetak.”',
        figureCaption: 'Gambar 5.3 — Pengukuran distribusi iluminasi (lux) pada meja baca utama.',
        accentColor: '#9A3412',
      },
      {
        pageNumber: 7,
        kicker: '06 / INDEKS & SPESIFIKASI TEKNIS',
        title: 'Data Kuratorial & Matriks Dimensi Proyek',
        subtitle: 'Dokumentasi terukur dari enam belas monumen terpilih',
        bodyParagraphs: [
          'Seluruh pengukuran lapangan dilakukan menggunakan pemindaian laser fotogrametri presisi milimeter selama periode kemarau dan penghujan tahun 2025–2026.',
          'Tabel arsip mencatat koefisien transmisi termal, rasio bukaan dinding (WWR), serta jejak karbon terkandung dari setiap material utama.',
        ],
        figureCaption: 'Tabel 6.1 — Ringkasan parameter performa pasif bangunan.',
        accentColor: '#334155',
      },
      {
        pageNumber: 8,
        kicker: 'KOLOFON · SAMPUL BELAKANG',
        title: 'Catatan Penerbitan & Hak Cipta',
        subtitle: 'Disusun dengan standar tipografi arsip museum internasional',
        bodyParagraphs: [
          'Dicetak secara digital dan dipublikasikan melalui Folio3D Interactive Flipbook Platform. Huruf utama menggunakan Fraunces Old-Style Serif berpadu dengan Plus Jakarta Sans.',
          'Seluruh hak cipta tata letak, ilustrasi vektor, dan esai arsitektur dilindungi undang-undang penerbitan.',
        ],
        figureCaption: 'ISBN 978-602-8841-26-9 · Atelier Meridien Press',
        accentColor: '#1C1917',
      },
    ],
  },
  'botanical-atlas': {
    id: 'botanical-atlas',
    title: 'Atlas Botani & Flora Endemik Kepulauan',
    author: 'Herbarium Nasional & Dr. Ratna Pramesti',
    issueNumber: 'EDISI VIII · HERBARIUM NUSANTARA',
    description:
      'Katalog ilmiah berilustrasi mengenai taksonomi anggrek hutan hujan, pakis purba, dan tanaman obat aromatik dari ekspedisi pegunungan tropis.',
    coverTint: '#14532D',
    accentHex: '#15803D',
    chapters: [
      {
        pageNumber: 1,
        kicker: 'SAMPUL DEPAN · KOLEKSI HERBARIUM',
        title: 'Atlas Botani & Flora Endemik Kepulauan',
        subtitle: 'Dokumentasi Morfologi & Ekologi Hutan Hujan Pegunungan',
        bodyParagraphs: [
          'Ilustrasi Taksonomi & Catatan Lapangan Ekspedisi Botani 2026.',
          'Oleh Herbarium Nasional & Dr. Ratna Pramesti.',
        ],
        figureCaption: 'Koleksi Spesimen #HB-884 · Ketinggian 1.400–2.600 mdpl',
        accentColor: '#14532D',
      },
      {
        pageNumber: 2,
        kicker: '01 / EKOLOGI HUTAN KABUT',
        title: 'Zona Montolitik & Kelembapan Abadi',
        subtitle: 'Mikroklimat kanopi yang menopang kehidupan epifit langka',
        bodyParagraphs: [
          'Pada ketinggian di atas seribu delapan ratus meter, awan orografis menyelimuti batang-batang pohon tua sepanjang hari, menciptakan laboratorium evolusi yang terisolasi.',
          'Lumut bryophyta bekerja sebagai spons hidrologis raksasa yang menyimpan cadangan air murni bagi ratusan spesies anggrek mikro.',
        ],
        pullQuote: '“Setiap helai daun di hutan kabut adalah arsip hidup dari ribuan tahun adaptasi iklim.”',
        figureCaption: 'Spesimen 1.A — Nepenthes montana pada substrat ultrabasa.',
        accentColor: '#15803D',
      },
      {
        pageNumber: 3,
        kicker: '02 / TAKSONOMI ORCHIDACEAE',
        title: 'Simetri Labellum & Polinasi Spesifik',
        subtitle: 'Koevolusi morfologi mahkota bunga terhadap serangga penyerbuk',
        bodyParagraphs: [
          'Struktur kelopak dorsal dan labellum berornamen rumit memandu lebah soliter menuju kolumna dengan presisi mekanis yang menakjubkan.',
          'Pigmen antosianin pada spesies endemik menunjukkan pola pantulan spektrum khusus yang hanya tampak bagi mata serangga hutan.',
        ],
        figureCaption: 'Spesimen 2.B — Dendrobium spectabile (Potongan membujur 4x).',
        accentColor: '#166534',
      },
      {
        pageNumber: 4,
        kicker: '03 / FITOKIMIA & KONSERVASI',
        title: 'Pelestarian Bank Benih In-Situ & Ex-Situ',
        subtitle: 'Protokol kriopreservasi spora dan biji mikroskopis',
        bodyParagraphs: [
          'Melalui pemetaan genetik dan penyimpanan biji pada suhu rendah terkendali, kelangsungan hidup populasi flora terancam dapat dijaga untuk generasi mendatang.',
          'Kolaborasi bersama masyarakat adat memastikan perlindungan koridor hutan primer tetap lestari.',
        ],
        figureCaption: 'Tabel 3.1 — Indeks viabilitas benih koleksi tahun 2026.',
        accentColor: '#14532D',
      },
      {
        pageNumber: 5,
        kicker: '04 / PTERIDOPHYTA PURBA',
        title: 'Geometri Fraktal Pakis Pohon Raksasa',
        subtitle: 'Cyathea contaminans dan mekanisme pembukaan ental muda',
        bodyParagraphs: [
          'Gulungan ental muda (fiddlehead) membuka diri mengikuti deret logaritmik Fibonacci untuk memaksimalkan tangkapan foton di lantai hutan yang teduh.',
          'Batang berserat tebal memberikan perlindungan termal alami terhadap fluktuasi suhu malam pegunungan.',
        ],
        pullQuote: '“Geometri alam tidak pernah bersifat dekoratif semata; setiap lekuk adalah efisiensi energi.”',
        figureCaption: 'Spesimen 4.C — Pola sporangia bawah daun perbesaran 20x.',
        accentColor: '#15803D',
      },
      {
        pageNumber: 6,
        kicker: 'KOLOFON · ARSIP BOTANI',
        title: 'Indeks Spesimen & Kredit Kuratorial',
        subtitle: 'Diterbitkan untuk tujuan riset dan edukasi publik',
        bodyParagraphs: [
          'Seluruh ilustrasi botani digambar langsung dari spesimen hidup di lapangan sebelum proses pengeringan herbarium.',
          'Dicetak di atas kertas bebas asam standar konservasi museum.',
        ],
        figureCaption: 'ISSN 2089-4412 · Herbarium Press 2026',
        accentColor: '#14532D',
      },
    ],
  },
  'typo-manifesto': {
    id: 'typo-manifesto',
    title: 'Tipografi Editorial & Sistem Grid Modern',
    author: 'Lukas Hendrawan · Swiss-Indo Design Press',
    issueNumber: 'ISSUE 09 · MONOGRAFI DESAIN KOMUNIKASI',
    description:
      'Panduan komprehensif mengenai proporsi halaman kanonik, anatomi huruf serif transisional, irama vertikal baseline, dan arsitektur publikasi cetak.',
    coverTint: '#1E293B',
    accentHex: '#1E3A8A',
    chapters: [
      {
        pageNumber: 1,
        kicker: 'SAMPUL DEPAN · EDISI DESAIN',
        title: 'Tipografi Editorial & Sistem Grid Modern',
        subtitle: 'Matematika Proporsi, Ruang Kosong, dan Keterbacaan Jangka Panjang',
        bodyParagraphs: [
          'Pedoman Praktis Arsitektur Halaman bagi Desainer Buku & Kurator Digital.',
          'Swiss-Indo Design Press · Edisi Revisi 2026.',
        ],
        figureCaption: 'Rasio Kanonik Villard de Honnecourt · Grid 12 Kolom',
        accentColor: '#1E3A8A',
      },
      {
        pageNumber: 2,
        kicker: '01 / KANON PROPORSI HALAMAN',
        title: 'Margin Sebagai Bingkai Akustik Teks',
        subtitle: 'Mengapa ruang kosong di tepi kertas menentukan martabat buku',
        bodyParagraphs: [
          'Dalam tradisi pembukuan klasik sejak era Renaisans, margin bawah dan luar selalu dirancang lebih lapang untuk memberikan tempat istirahat bagi ibu jari pembaca sekaligus menjaga kolom teks tetap terkonsentrasi.',
          'Perbandingan progresif 2:3:4:6 antara margin dalam, atas, luar, dan bawah menciptakan harmoni geometris yang abadi.',
        ],
        pullQuote: '“Tipografi yang agung tidak berteriak meminta perhatian; ia mengundang mata untuk menetap dengan tenang.”',
        figureCaption: 'Diagram 1.1 — Konstruksi diagonal ganda untuk penentuan area cetak.',
        accentColor: '#1E3A8A',
      },
      {
        pageNumber: 3,
        kicker: '02 / IRAMA VERTIKAL & LEADING',
        title: 'Disiplin Baseline Grid dan Ukuran Baris',
        subtitle: 'Menjaga keselarasan lintas kolom pada bukaan dua halaman',
        bodyParagraphs: [
          'Lebar kolom ideal untuk bacaan panjang berada pada rentang 60 hingga 72 karakter per baris. Baris yang terlalu panjang melelahkan mata saat berpindah ke awal baris berikutnya.',
          'Jarak antarbaris (leading) sebesar 1,65 hingga 1,75 kali ukuran huruf pokok memberikan ruang bernapas bagi huruf ber-ascender tinggi.',
        ],
        figureCaption: 'Diagram 2.3 — Perbandingan kepadatan warna tipografi (typographic color).',
        accentColor: '#9A3412',
      },
      {
        pageNumber: 4,
        kicker: 'KOLOFON · SWISS-INDO PRESS',
        title: 'Spesifikasi Produksi & Lisensi Huruf',
        subtitle: 'Standar ketajaman vektor dan rasterisasi layar Retina',
        bodyParagraphs: [
          'Dokumen ini dirender menggunakan kanvas berketajaman tinggi dengan kompensasi rasio piksel perangkat otomatis.',
          'Hak cipta © 2026 Swiss-Indo Design Press. Seluruh hak dilindungi.',
        ],
        figureCaption: 'Katalog Desain #SD-2026-09',
        accentColor: '#1E293B',
      },
    ],
  },
};

export interface SpreadState {
  currentPage: number;
  totalPages: number;
  visiblePages: number[];
  isCoverFront: boolean;
  isCoverBack: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  prevTargetPage: number;
  nextTargetPage: number;
  progressPercent: number;
  label: string;
}

/**
 * Computes deterministic spread state for both Desktop Spread (2-page) and Mobile Single (1-page) modes.
 */
export function calculateSpreadState(
  rawPage: number,
  rawTotalPages: number,
  isMobileSingle: boolean
): SpreadState {
  const totalPages = Math.max(1, Math.floor(rawTotalPages || 1));
  const currentPage = Math.min(totalPages, Math.max(1, Math.floor(rawPage || 1)));

  if (isMobileSingle || totalPages === 1) {
    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;
    const progressPercent =
      totalPages <= 1 ? 100 : Math.round(((currentPage - 1) / (totalPages - 1)) * 100);

    return {
      currentPage,
      totalPages,
      visiblePages: [currentPage],
      isCoverFront: currentPage === 1,
      isCoverBack: currentPage === totalPages && totalPages > 1,
      canGoPrev,
      canGoNext,
      prevTargetPage: Math.max(1, currentPage - 1),
      nextTargetPage: Math.min(totalPages, currentPage + 1),
      progressPercent,
      label: `Halaman ${currentPage} dari ${totalPages}`,
    };
  }

  // Desktop 2-page spread logic:
  // Page 1 is Front Cover (single right-hand leaf).
  // Pages (2,3), (4,5), (6,7)... are paired side-by-side spreads.
  // If totalPages is even, the last page stands as Back Cover on the left leaf.
  if (currentPage === 1) {
    return {
      currentPage: 1,
      totalPages,
      visiblePages: [1],
      isCoverFront: true,
      isCoverBack: false,
      canGoPrev: false,
      canGoNext: totalPages > 1,
      prevTargetPage: 1,
      nextTargetPage: Math.min(totalPages, 2),
      progressPercent: 0,
      label: `Halaman 1 dari ${totalPages}`,
    };
  }

  // Normalize interior page to even left page of spread: (2,3), (4,5), etc.
  const leftPage = currentPage % 2 === 0 ? currentPage : currentPage - 1;
  const rightPage = leftPage + 1 <= totalPages ? leftPage + 1 : null;
  const visiblePages = rightPage ? [leftPage, rightPage] : [leftPage];
  const isCoverBack = rightPage === null && leftPage === totalPages;

  const canGoPrev = leftPage > 1;
  const canGoNext = (rightPage ?? leftPage) < totalPages;
  const prevTargetPage = leftPage === 2 ? 1 : Math.max(1, leftPage - 2);
  const nextTargetPage = Math.min(totalPages, leftPage + 2);

  const highestVisible = rightPage ?? leftPage;
  const progressPercent = Math.round(((highestVisible - 1) / (totalPages - 1)) * 100);

  const label = rightPage
    ? `Halaman ${leftPage}–${rightPage} dari ${totalPages}`
    : `Halaman ${leftPage} dari ${totalPages}`;

  return {
    currentPage: leftPage,
    totalPages,
    visiblePages,
    isCoverFront: false,
    isCoverBack,
    canGoPrev,
    canGoNext,
    prevTargetPage,
    nextTargetPage,
    progressPercent,
    label,
  };
}

/**
 * Encodes a BookConfig into a URL-safe Base64 token for shareable reader links.
 */
export function encodeShareConfig(config: BookConfig): string {
  const payload = {
    t: config.title,
    a: config.author,
    d: config.description,
    i: config.issueNumber,
    p: config.publishedDate,
    st: config.pdfSourceType === 'local' ? 'preset' : config.pdfSourceType,
    pr: config.presetId,
    u: config.pdfUrl,
    dl: config.allowDownload ? 1 : 0,
    pt: config.allowPrint ? 1 : 0,
    sn: config.enableSound ? 1 : 0,
    th: config.showThumbnails ? 1 : 0,
    pw: config.passwordProtected ? 1 : 0,
    pk: config.passwordProtected ? config.password : '',
    rt: config.readerTheme,
  };

  const json = JSON.stringify(payload);
  const utf8Bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(json, 'utf-8').toString('base64');

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes a URL-safe Base64 token or hash fragment back into a complete BookConfig.
 */
export function decodeShareConfig(input: string): BookConfig | null {
  if (!input || typeof input !== 'string') return null;

  try {
    let token = input.trim();
    if (token.startsWith('#')) token = token.slice(1);
    if (token.includes('cfg=')) {
      const params = new URLSearchParams(token.replace(/^[#?]/, ''));
      token = params.get('cfg') || '';
    }
    if (!token) return null;

    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);

    let json = '';
    if (typeof atob === 'function') {
      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      json = new TextDecoder().decode(bytes);
    } else {
      json = Buffer.from(padded, 'base64').toString('utf-8');
    }

    const p = JSON.parse(json);
    if (!p || typeof p.t !== 'string') return null;

    const presetId: PresetEdition['id'] =
      p.pr === 'botanical-atlas' || p.pr === 'typo-manifesto' ? p.pr : 'arch-light';

    return {
      ...DEFAULT_BOOK_CONFIG,
      title: p.t || DEFAULT_BOOK_CONFIG.title,
      author: p.a || DEFAULT_BOOK_CONFIG.author,
      description: p.d ?? DEFAULT_BOOK_CONFIG.description,
      issueNumber: p.i || DEFAULT_BOOK_CONFIG.issueNumber,
      publishedDate: p.p || DEFAULT_BOOK_CONFIG.publishedDate,
      pdfSourceType: p.st === 'url' ? 'url' : 'preset',
      presetId,
      pdfUrl: typeof p.u === 'string' ? p.u : '',
      allowDownload: Boolean(p.dl),
      allowPrint: Boolean(p.pt),
      enableSound: Boolean(p.sn),
      showThumbnails: Boolean(p.th),
      passwordProtected: Boolean(p.pw && p.pk),
      password: p.pk ? String(p.pk) : '',
      readerTheme: p.rt === 'archival' ? 'archival' : 'dark',
    };
  } catch {
    return null;
  }
}

/**
 * Verifies password input when a book has password protection enabled.
 */
export function verifyBookPassword(
  config: Pick<BookConfig, 'passwordProtected' | 'password'>,
  attempt: string
): { unlocked: boolean; error?: string } {
  if (!config.passwordProtected || !config.password.trim()) {
    return { unlocked: true };
  }
  const cleanAttempt = (attempt || '').trim();
  if (!cleanAttempt) {
    return { unlocked: false, error: 'Masukkan kata sandi untuk membuka publikasi ini.' };
  }
  if (cleanAttempt !== config.password.trim()) {
    return { unlocked: false, error: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
  }
  return { unlocked: true };
}

/**
 * Validates a direct PDF URL input from the Admin dashboard.
 */
export function validatePdfUrlInput(url: string): { valid: boolean; error?: string } {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Masukkan URL file PDF yang valid (diawali https:// atau http://).' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL harus menggunakan protokol HTTP atau HTTPS.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Format URL tidak valid. Pastikan menyertakan https://.' };
  }
}

/**
 * Escapes characters for PDF literal strings.
 */
function escapePdfText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generates a real, standards-compliant multi-page PDF binary (Uint8Array) in memory.
 * This allows PDF.js to parse real PDF bytes and allows the Download PDF button to save a real PDF file.
 */
export function generateMinimalValidPdfBytes(
  config: Pick<BookConfig, 'title' | 'author' | 'description' | 'issueNumber'>,
  chapters: BookChapter[]
): Uint8Array {
  const objects: string[] = [];
  const addObject = (body: string): number => {
    objects.push(body);
    return objects.length; // 1-based object number
  };

  // Object 1: Catalog (placeholder updated after pages known)
  addObject('');
  // Object 2: Pages root (placeholder updated after pages known)
  addObject('');
  // Object 3: Font Helvetica
  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  // Object 4: Font Helvetica-Bold
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  const pageIds: number[] = [];

  chapters.forEach((ch, idx) => {
    const lines: string[] = [];
    // Background fill & border frame
    lines.push('0.97 0.96 0.93 rg');
    lines.push('0 0 595 842 re f');
    lines.push('0.18 0.16 0.14 RG 1 w');
    lines.push('36 36 523 770 re S');

    // Top header kicker
    lines.push('BT');
    lines.push(`/F2 9 Tf 0.45 0.22 0.08 rg 56 770 Td (${escapePdfText(ch.kicker)}) Tj`);
    lines.push('ET');

    // Main title
    lines.push('BT');
    lines.push(`/F2 20 Tf 0.11 0.10 0.09 rg 56 730 Td (${escapePdfText(ch.title.slice(0, 48))}) Tj`);
    lines.push('ET');

    // Subtitle
    lines.push('BT');
    lines.push(`/F1 11 Tf 0.35 0.32 0.29 rg 56 704 Td (${escapePdfText(ch.subtitle.slice(0, 72))}) Tj`);
    lines.push('ET');

    // Divider line
    lines.push('0.80 0.77 0.72 RG 0.75 w 56 686 m 539 686 l S');

    // Body paragraphs
    let yCursor = 650;
    ch.bodyParagraphs.forEach((para) => {
      const words = para.split(/\s+/);
      let currentLine = '';
      words.forEach((word) => {
        if ((currentLine + ' ' + word).trim().length > 68) {
          lines.push('BT');
          lines.push(`/F1 11 Tf 0.15 0.14 0.13 rg 56 ${yCursor} Td (${escapePdfText(currentLine.trim())}) Tj`);
          lines.push('ET');
          yCursor -= 18;
          currentLine = word;
        } else {
          currentLine = (currentLine + ' ' + word).trim();
        }
      });
      if (currentLine) {
        lines.push('BT');
        lines.push(`/F1 11 Tf 0.15 0.14 0.13 rg 56 ${yCursor} Td (${escapePdfText(currentLine.trim())}) Tj`);
        lines.push('ET');
        yCursor -= 28;
      }
    });

    // Footer page number & book title
    lines.push('BT');
    lines.push(
      `/F1 9 Tf 0.45 0.42 0.38 rg 56 56 Td (${escapePdfText(config.title.slice(0, 45))}  |  Halaman ${idx + 1} dari ${chapters.length}) Tj`
    );
    lines.push('ET');

    const streamContent = lines.join('\n');
    const contentId = addObject(
      `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`
    );

    const pageId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export const ADMIN_WHITELIST_EMAIL = 'marhaniza05@gmail.com';
export const DEFAULT_ADMIN_INITIAL_PASSWORD = 'AdminElibrary#2026';

export interface AdminAccessResult {
  authorized: boolean;
  normalizedEmail: string;
  message: string;
}

/**
 * Deterministic synchronous hash (FNV-1a 64-bit hex pair) used to salt and hash admin passwords
 * consistently across browser and Node test environments alongside Web Crypto SHA-256.
 */
export function computeAdminPasswordHash(rawPassword: string): string {
  const input = `elibrary_salt_2026::${rawPassword || ''}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `adm_v2_${hex1}${hex2}`;
}

/**
 * Evaluates whether an officially verified Google OAuth account email matches the single whitelisted administrator account.
 */
export function evaluateAdminAccess(rawEmail: string | null | undefined): AdminAccessResult {
  const normalizedEmail = (rawEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      authorized: false,
      normalizedEmail: '',
      message: 'Akun Google tidak mengembalikan alamat email yang valid.',
    };
  }
  if (normalizedEmail === ADMIN_WHITELIST_EMAIL) {
    return {
      authorized: true,
      normalizedEmail,
      message: `Otentikasi berhasil! Selamat datang Administrator (${normalizedEmail}).`,
    };
  }
  return {
    authorized: false,
    normalizedEmail,
    message: 'Akses Ditolak: Akun Anda tidak memiliki izin sebagai Administrator',
  };
}

/**
 * Strictly verifies both the whitelisted Administrator email AND the secret Administrator password hash.
 * Never grants access with email alone.
 */
export function verifyAdminEmailAndPassword(
  rawEmail: string | null | undefined,
  rawPassword: string | null | undefined,
  storedPasswordHash?: string | null
): AdminAccessResult {
  const normalizedEmail = (rawEmail || '').trim().toLowerCase();
  const password = rawPassword || '';

  if (!normalizedEmail) {
    return {
      authorized: false,
      normalizedEmail: '',
      message: 'Masukkan alamat email Google Administrator resmi terlebih dahulu.',
    };
  }

  if (!password.trim()) {
    return {
      authorized: false,
      normalizedEmail,
      message: 'Kata Sandi Pengaman Admin wajib diisi. Akses tanpa kata sandi ditolak demi keamanan.',
    };
  }

  if (normalizedEmail !== ADMIN_WHITELIST_EMAIL) {
    return {
      authorized: false,
      normalizedEmail,
      message: 'Akses Ditolak: Akun Anda tidak memiliki izin sebagai Administrator',
    };
  }

  const activeHash =
    storedPasswordHash && storedPasswordHash.trim()
      ? storedPasswordHash.trim()
      : computeAdminPasswordHash(DEFAULT_ADMIN_INITIAL_PASSWORD);

  const attemptHash = computeAdminPasswordHash(password);
  if (attemptHash !== activeHash) {
    return {
      authorized: false,
      normalizedEmail,
      message: 'Akses Ditolak: Kata Sandi Pengaman Admin salah.',
    };
  }

  return {
    authorized: true,
    normalizedEmail,
    message: `Verifikasi Keamanan Berhasil! Selamat datang Administrator (${normalizedEmail}).`,
  };
}

/**
 * Validates changing the Administrator password.
 */
export function validateAdminPasswordChange(
  currentPasswordInput: string,
  newPasswordInput: string,
  confirmPasswordInput: string,
  storedPasswordHash?: string | null,
  skipCurrentPasswordCheck = false
): { valid: boolean; newHash?: string; message: string } {
  const activeHash =
    storedPasswordHash && storedPasswordHash.trim()
      ? storedPasswordHash.trim()
      : computeAdminPasswordHash(DEFAULT_ADMIN_INITIAL_PASSWORD);

  if (!skipCurrentPasswordCheck) {
    if (!currentPasswordInput) {
      return {
        valid: false,
        message: 'Masukkan kata sandi admin saat ini terlebih dahulu.',
      };
    }
    if (computeAdminPasswordHash(currentPasswordInput) !== activeHash) {
      return {
        valid: false,
        message: 'Kata sandi admin saat ini tidak sesuai.',
      };
    }
  }

  const cleanNew = (newPasswordInput || '').trim();
  if (cleanNew.length < 6) {
    return {
      valid: false,
      message: 'Kata sandi baru minimal harus terdiri dari 6 karakter.',
    };
  }

  if (newPasswordInput !== confirmPasswordInput) {
    return {
      valid: false,
      message: 'Konfirmasi kata sandi baru tidak cocok.',
    };
  }

  return {
    valid: true,
    newHash: computeAdminPasswordHash(newPasswordInput),
    message: 'Kata Sandi Pengaman Admin berhasil diperbarui secara permanen.',
  };
}

export interface AdminPasswordResetEmailValidation {
  allowed: boolean;
  normalizedEmail: string;
  continueUrl: string;
  message: string;
}

/**
 * Strictly validates an email address before invoking Firebase Auth's sendPasswordResetEmail.
 * Only the single whitelisted administrator email (marhaniza05@gmail.com) is permitted to receive a reset link.
 */
export function validateAdminPasswordResetEmail(
  rawEmail: string | null | undefined,
  baseAppUrl = 'http://localhost:3000/'
): AdminPasswordResetEmailValidation {
  const normalizedEmail = (rawEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      allowed: false,
      normalizedEmail: '',
      continueUrl: '',
      message: 'Masukkan alamat email Google Administrator resmi terlebih dahulu untuk menerima tautan pemulihan.',
    };
  }

  if (normalizedEmail !== ADMIN_WHITELIST_EMAIL) {
    return {
      allowed: false,
      normalizedEmail,
      continueUrl: '',
      message:
        'Akses Ditolak: Tautan pemulihan kata sandi hanya dapat dikirim ke email Administrator resmi yang terdaftar dalam whitelist.',
    };
  }

  const cleanBase = (baseAppUrl || 'http://localhost:3000/').split('#')[0].split('?')[0];
  const continueUrl = `${cleanBase}?adminResetVerify=1&email=${encodeURIComponent(ADMIN_WHITELIST_EMAIL)}`;

  return {
    allowed: true,
    normalizedEmail,
    continueUrl,
    message: `Tautan verifikasi & reset kata sandi telah dikirim ke email Administrator resmi (${normalizedEmail}).`,
  };
}

/**
 * Validates setting a new security password after completing the email verification / reset link flow,
 * ensuring the target email strictly matches the whitelist.
 */
export function validateVerifiedPasswordResetSubmission(
  rawEmail: string | null | undefined,
  newPasswordInput: string,
  confirmPasswordInput: string
): { valid: boolean; newHash?: string; message: string } {
  const whitelistCheck = evaluateAdminAccess(rawEmail);
  if (!whitelistCheck.authorized) {
    return {
      valid: false,
      message: 'Akses Ditolak: Verifikasi pemulihan sandi hanya berlaku untuk email Administrator resmi.',
    };
  }

  return validateAdminPasswordChange('', newPasswordInput, confirmPasswordInput, null, true);
}

// =========================================================
// PURE LOGIC FOR CRUD ETALASE & KONTEN HALAMAN BUKU
// =========================================================

export interface EditableBookPage {
  pageNumber: number;
  kicker: string;
  title: string;
  subtitle: string;
  body: string;
  customImageDataUrl?: string;
}

export interface EtalaseBookRecord {
  id: string;
  shelfId: string;
  title: string;
  author: string;
  description: string;
  kicker?: string;
  pageCount: number;
  passwordProtected: boolean;
  password?: string;
  accent: string;
  spineColor: string;
  coverUrl?: string;
  editablePages?: EditableBookPage[];
}

export type PageCrudAction =
  | {
      type: 'add';
      afterIndex?: number;
      kicker?: string;
      title?: string;
      subtitle?: string;
      body?: string;
    }
  | {
      type: 'update';
      index: number;
      patch: Partial<Omit<EditableBookPage, 'pageNumber'>>;
    }
  | {
      type: 'delete';
      index: number;
    }
  | {
      type: 'move-up';
      index: number;
    }
  | {
      type: 'move-down';
      index: number;
    }
  | {
      type: 'sync-cover';
      bookTitle: string;
      bookAuthor: string;
      bookDescription: string;
      bookKicker?: string;
    };

export function normalizeEditablePagesOrder(pages: EditableBookPage[]): EditableBookPage[] {
  return pages.map((p, idx) => ({
    ...p,
    pageNumber: idx + 1,
  }));
}

export function buildDefaultEditablePagesForBook(book: {
  title: string;
  author: string;
  description: string;
  kicker?: string;
  pageCount?: number;
}): EditableBookPage[] {
  const total = Math.max(2, Math.min(50, Number(book.pageCount) || 6));
  const cleanTitle = (book.title || 'Publikasi Tanpa Judul').trim();
  const cleanDesc = (book.description || 'Koleksi literatur digital interaktif dengan efek lembaran 3D.').trim();
  const cleanKicker = (book.kicker || 'KOLEKSI PUSTAKA 3D').trim();

  const pages: EditableBookPage[] = [];
  for (let i = 0; i < total; i++) {
    const isCover = i === 0;
    pages.push({
      pageNumber: i + 1,
      kicker: isCover ? cleanKicker : `BAGIAN ${String(i).padStart(2, '0')}`,
      title: isCover ? cleanTitle : `Bab ${i}: Pembahasan & Kajian Utama`,
      subtitle: isCover
        ? cleanDesc.slice(0, 68)
        : `Eksplorasi materi bagian ${i} pada koleksi ${cleanTitle}`,
      body: isCover
        ? cleanDesc
        : `${cleanDesc} Bagian ini memuat uraian mendalam, kutipan ilmiah, dan intisari pembelajaran yang dapat disunting langsung melalui Menu Edit CRUD Konten Buku.`,
    });
  }
  return pages;
}

export function applyPageCrudAction(
  currentPages: EditableBookPage[],
  action: PageCrudAction
): EditableBookPage[] {
  const list = Array.isArray(currentPages) ? currentPages.map((p) => ({ ...p })) : [];

  if (action.type === 'add') {
    const insertIdx =
      typeof action.afterIndex === 'number' && action.afterIndex >= 0 && action.afterIndex < list.length
        ? action.afterIndex + 1
        : list.length;
    const newPageNum = insertIdx + 1;
    const newPage: EditableBookPage = {
      pageNumber: newPageNum,
      kicker: (action.kicker || `BAGIAN ${String(newPageNum - 1).padStart(2, '0')}`).trim(),
      title: (action.title || `Bab ${newPageNum - 1}: Topik Pembahasan Baru`).trim(),
      subtitle: (action.subtitle || 'Subjudul atau ringkasan pokok bahasan halaman ini').trim(),
      body: (
        action.body ||
        'Tuliskan isi materi, narasi bab, atau penjelasan lengkap pada halaman ini. Seluruh teks akan dirender secara tajam ke lembaran buku 3D.'
      ).trim(),
    };
    list.splice(insertIdx, 0, newPage);
    return normalizeEditablePagesOrder(list);
  }

  if (action.type === 'update') {
    if (action.index < 0 || action.index >= list.length) {
      return normalizeEditablePagesOrder(list);
    }
    const target = list[action.index];
    list[action.index] = {
      ...target,
      ...action.patch,
      pageNumber: action.index + 1,
    };
    return normalizeEditablePagesOrder(list);
  }

  if (action.type === 'delete') {
    if (list.length <= 1) {
      return normalizeEditablePagesOrder(list);
    }
    if (action.index < 0 || action.index >= list.length) {
      return normalizeEditablePagesOrder(list);
    }
    list.splice(action.index, 1);
    return normalizeEditablePagesOrder(list);
  }

  if (action.type === 'move-up') {
    if (action.index <= 0 || action.index >= list.length) {
      return normalizeEditablePagesOrder(list);
    }
    const temp = list[action.index - 1];
    list[action.index - 1] = list[action.index];
    list[action.index] = temp;
    return normalizeEditablePagesOrder(list);
  }

  if (action.type === 'move-down') {
    if (action.index < 0 || action.index >= list.length - 1) {
      return normalizeEditablePagesOrder(list);
    }
    const temp = list[action.index + 1];
    list[action.index + 1] = list[action.index];
    list[action.index] = temp;
    return normalizeEditablePagesOrder(list);
  }

  if (action.type === 'sync-cover') {
    const cleanTitle = (action.bookTitle || 'Publikasi Tanpa Judul').trim();
    const cleanDesc = (action.bookDescription || '').trim();
    const cleanKicker = (action.bookKicker || 'SAMPUL DEPAN').trim();
    if (list.length === 0) {
      return buildDefaultEditablePagesForBook({
        title: cleanTitle,
        author: action.bookAuthor,
        description: cleanDesc,
        kicker: cleanKicker,
        pageCount: 4,
      });
    }
    list[0] = {
      ...list[0],
      pageNumber: 1,
      kicker: cleanKicker,
      title: cleanTitle,
      subtitle: cleanDesc.slice(0, 68) || list[0].subtitle,
      body: cleanDesc || list[0].body,
    };
    return normalizeEditablePagesOrder(list);
  }

  return normalizeEditablePagesOrder(list);
}

export type EtalaseBookCrudAction =
  | {
      type: 'create';
      book: EtalaseBookRecord;
    }
  | {
      type: 'update';
      id: string;
      patch: Partial<EtalaseBookRecord>;
    }
  | {
      type: 'delete';
      id: string;
    }
  | {
      type: 'duplicate';
      id: string;
      newId: string;
    }
  | {
      type: 'reorder';
      id: string;
      direction: 'up' | 'down';
    };

export function applyEtalaseBookCrudAction(
  currentBooks: EtalaseBookRecord[],
  action: EtalaseBookCrudAction
): EtalaseBookRecord[] {
  const list = Array.isArray(currentBooks) ? currentBooks.map((b) => ({ ...b })) : [];

  if (action.type === 'create') {
    return [action.book, ...list];
  }

  if (action.type === 'update') {
    return list.map((b) => (b.id === action.id ? { ...b, ...action.patch, id: b.id } : b));
  }

  if (action.type === 'delete') {
    return list.filter((b) => b.id !== action.id);
  }

  if (action.type === 'duplicate') {
    const idx = list.findIndex((b) => b.id === action.id);
    if (idx < 0) return list;
    const source = list[idx];
    const copy: EtalaseBookRecord = {
      ...source,
      id: action.newId,
      title: `${source.title} (Salinan)`,
      editablePages: source.editablePages
        ? source.editablePages.map((p, i) =>
            i === 0 ? { ...p, title: `${source.title} (Salinan)` } : { ...p }
          )
        : undefined,
    };
    const next = [...list];
    next.splice(idx + 1, 0, copy);
    return next;
  }

  if (action.type === 'reorder') {
    const idx = list.findIndex((b) => b.id === action.id);
    if (idx < 0) return list;
    const targetIdx = action.direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return list;
    const next = [...list];
    const temp = next[targetIdx];
    next[targetIdx] = next[idx];
    next[idx] = temp;
    return next;
  }

  return list;
}

export interface StoredBookAssetLike {
  id?: string;
  isCustomPdf?: boolean;
  pdfDataUrl?: string;
  coverUrl?: string;
  pagesDataUrls?: Array<{ pageNumber: number; title?: string; dataUrl: string }>;
  originalPagesDataUrls?: Array<{ pageNumber: number; title?: string; dataUrl: string }>;
  editablePages?: EditableBookPage[];
}

/**
 * Determines whether a book record or its stored asset represents an original uploaded PDF or custom image book
 * whose visual page content must never be overwritten by synthetic canvas templates.
 */
export function isOriginalUploadedBook(
  book?: Partial<EtalaseBookRecord> & { isCustomPdf?: boolean; hasCustomCoverImage?: boolean; pdfUrl?: string } | null,
  asset?: StoredBookAssetLike | null
): boolean {
  if (!book && !asset) return false;
  const id = String(book?.id || asset?.id || '');
  if (id.startsWith('book-pdf-')) return true;
  if (book?.isCustomPdf || asset?.isCustomPdf) return true;
  if (asset?.pdfDataUrl) return true;
  if (book?.hasCustomCoverImage) return true;
  if (Array.isArray(asset?.originalPagesDataUrls) && asset.originalPagesDataUrls.length > 0) return true;
  if (Array.isArray(book?.editablePages) && book.editablePages.some((p) => Boolean(p?.customImageDataUrl))) {
    return true;
  }
  if (Array.isArray(asset?.editablePages) && asset.editablePages.some((p) => Boolean(p?.customImageDataUrl))) {
    return true;
  }
  return false;
}

/**
 * Hydrates editable pages for a book while strictly preserving original rendered PDF page images
 * (`originalPagesDataUrls` / `pagesDataUrls`) or uploaded custom page images (`customImageDataUrl`).
 */
export function hydrateEditablePagesPreservingOriginals(
  book: {
    id?: string;
    title: string;
    author: string;
    description: string;
    kicker?: string;
    pageCount?: number;
    isCustomPdf?: boolean;
    hasCustomCoverImage?: boolean;
    editablePages?: EditableBookPage[];
  },
  asset?: StoredBookAssetLike | null
): EditableBookPage[] {
  const isOriginal = isOriginalUploadedBook(book, asset);
  const originalSourceUrls =
    (Array.isArray(asset?.originalPagesDataUrls) && asset.originalPagesDataUrls.length > 0
      ? asset.originalPagesDataUrls
      : null) ||
    (isOriginal && Array.isArray(asset?.pagesDataUrls) && asset.pagesDataUrls.length > 0
      ? asset.pagesDataUrls
      : null);

  if (originalSourceUrls && originalSourceUrls.length > 0) {
    const existingEditable =
      (Array.isArray(asset?.editablePages) && asset.editablePages.length > 0
        ? asset.editablePages
        : book.editablePages) || [];

    return originalSourceUrls.map((item, idx) => {
      const existingPage = existingEditable[idx];
      return {
        pageNumber: idx + 1,
        kicker: existingPage?.kicker || (idx === 0 ? 'SAMPUL DOKUMEN ASLI' : `HALAMAN PDF ${idx + 1}`),
        title:
          existingPage?.title ||
          item.title ||
          (idx === 0 ? book.title || 'Sampul Depan' : `Halaman ${idx + 1}`),
        subtitle: existingPage?.subtitle || 'Konten Orisinal Flipbook 3D',
        body: existingPage?.body || '',
        customImageDataUrl: existingPage?.customImageDataUrl || item.dataUrl,
      };
    });
  }

  const candidatePages =
    (Array.isArray(asset?.editablePages) && asset.editablePages.length > 0
      ? asset.editablePages
      : book.editablePages) || [];

  if (candidatePages.length > 0) {
    return candidatePages.map((p, idx) => ({
      pageNumber: idx + 1,
      kicker: p.kicker || (idx === 0 ? book.kicker || 'SAMPUL DEPAN' : `BAGIAN ${String(idx).padStart(2, '0')}`),
      title: p.title || (idx === 0 ? book.title : `Halaman ${idx + 1}`),
      subtitle: p.subtitle || '',
      body: p.body || '',
      customImageDataUrl: p.customImageDataUrl || '',
    }));
  }

  return buildDefaultEditablePagesForBook(book);
}

/**
 * Updates a book's Etalase metadata (title, author, shelfId, kicker, accent, description, password)
 * while strictly preserving original PDF/image cover and page data URLs without converting them.
 */
export function applyMetadataUpdatePreservingOriginalContent(
  book: EtalaseBookRecord & {
    isCustomPdf?: boolean;
    hasCustomCoverImage?: boolean;
    customCoverDataUrl?: string;
  },
  pages: EditableBookPage[],
  patch: Partial<
    Pick<
      EtalaseBookRecord,
      'title' | 'author' | 'shelfId' | 'kicker' | 'accent' | 'spineColor' | 'description' | 'passwordProtected' | 'password'
    >
  >
): {
  updatedBook: EtalaseBookRecord & {
    isCustomPdf?: boolean;
    hasCustomCoverImage?: boolean;
    customCoverDataUrl?: string;
  };
  updatedPages: EditableBookPage[];
} {
  const isOriginal = isOriginalUploadedBook(book, { editablePages: pages });
  const nextBook = {
    ...book,
    ...patch,
    spineColor: patch.spineColor || patch.accent || book.spineColor || book.accent,
    isCustomPdf: Boolean(book.isCustomPdf || String(book.id || '').startsWith('book-pdf-')),
    hasCustomCoverImage: Boolean(
      book.hasCustomCoverImage ||
        isOriginal ||
        (pages[0] && Boolean(pages[0].customImageDataUrl))
    ),
  };

  const nextPages = pages.map((p, idx) => {
    if (idx === 0 && !isOriginal && !p.customImageDataUrl) {
      return {
        ...p,
        pageNumber: 1,
        title: nextBook.title,
        kicker: nextBook.kicker || p.kicker,
        subtitle: nextBook.description.slice(0, 68) || p.subtitle,
        body: nextBook.description || p.body,
      };
    }
    return {
      ...p,
      pageNumber: idx + 1,
    };
  });

  if (nextPages[0]?.customImageDataUrl) {
    nextBook.coverUrl = nextBookCoverFromOriginal(nextBook, nextPages[0].customImageDataUrl);
    nextBook.customCoverDataUrl = nextBook.coverUrl;
  }

  return {
    updatedBook: nextBook,
    updatedPages: nextPages,
  };
}

function nextBookCoverFromOriginal(
  book: { customCoverDataUrl?: string; coverUrl?: string },
  page1CustomImageDataUrl: string
): string {
  return book.customCoverDataUrl || page1CustomImageDataUrl || book.coverUrl || '';
}




