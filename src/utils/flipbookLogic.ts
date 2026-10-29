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

export interface AdminAccessResult {
  authorized: boolean;
  normalizedEmail: string;
  message: string;
}

/**
 * Evaluates whether a given email address matches the single whitelisted administrator account.
 */
export function evaluateAdminAccess(rawEmail: string | null | undefined): AdminAccessResult {
  const normalizedEmail = (rawEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      authorized: false,
      normalizedEmail: '',
      message: 'Masukkan alamat email Google Administrator resmi untuk melanjutkan.',
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
 * Determines whether a Firebase Auth popup error code is caused by preview domain / iframe restrictions
 * that should trigger direct administrator email verification fallback.
 */
export function shouldFallbackToDirectEmailVerify(errorCode: string | null | undefined): boolean {
  const code = (errorCode || '').trim().toLowerCase();
  return (
    code === 'auth/unauthorized-domain' ||
    code === 'auth/popup-blocked' ||
    code === 'auth/operation-not-supported-in-this-environment' ||
    code === 'auth/cancelled-popup-request'
  );
}

