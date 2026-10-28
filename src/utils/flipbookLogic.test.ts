import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BOOK_CONFIG,
  PRESET_EDITIONS,
  calculateSpreadState,
  encodeShareConfig,
  decodeShareConfig,
  verifyBookPassword,
  validatePdfUrlInput,
  generateMinimalValidPdfBytes,
} from './flipbookLogic';

test('calculateSpreadState handles desktop 2-page spread transitions accurately', () => {
  // Front cover is single page 1
  const cover = calculateSpreadState(1, 8, false);
  assert.deepEqual(cover.visiblePages, [1]);
  assert.equal(cover.isCoverFront, true);
  assert.equal(cover.canGoPrev, false);
  assert.equal(cover.canGoNext, true);
  assert.equal(cover.nextTargetPage, 2);

  // Page 2 pairs with Page 3
  const spread23 = calculateSpreadState(2, 8, false);
  assert.deepEqual(spread23.visiblePages, [2, 3]);
  assert.equal(spread23.canGoPrev, true);
  assert.equal(spread23.prevTargetPage, 1);
  assert.equal(spread23.nextTargetPage, 4);

  // Passing odd interior page 5 normalizes to spread [4, 5]
  const spread45 = calculateSpreadState(5, 8, false);
  assert.deepEqual(spread45.visiblePages, [4, 5]);
  assert.equal(spread45.currentPage, 4);

  // Back cover on even total pages (page 8 stands alone)
  const backCover = calculateSpreadState(8, 8, false);
  assert.deepEqual(backCover.visiblePages, [8]);
  assert.equal(backCover.isCoverBack, true);
  assert.equal(backCover.canGoNext, false);
  assert.equal(backCover.progressPercent, 100);
});

test('calculateSpreadState handles mobile single-page view accurately', () => {
  const page3 = calculateSpreadState(3, 8, true);
  assert.deepEqual(page3.visiblePages, [3]);
  assert.equal(page3.prevTargetPage, 2);
  assert.equal(page3.nextTargetPage, 4);
  assert.equal(page3.label, 'Halaman 3 dari 8');
});

test('encodeShareConfig and decodeShareConfig round-trip book settings and permissions', () => {
  const customConfig = {
    ...DEFAULT_BOOK_CONFIG,
    title: 'Katalog Pameran Seni Kontemporer',
    author: 'Galeri Nasional',
    allowDownload: false,
    allowPrint: false,
    enableSound: true,
    showThumbnails: false,
    passwordProtected: true,
    password: 'kunci2026',
    readerTheme: 'archival' as const,
  };

  const token = encodeShareConfig(customConfig);
  const decoded = decodeShareConfig(`#mode=reader&cfg=${token}`);

  assert.ok(decoded);
  assert.equal(decoded.title, 'Katalog Pameran Seni Kontemporer');
  assert.equal(decoded.author, 'Galeri Nasional');
  assert.equal(decoded.allowDownload, false);
  assert.equal(decoded.allowPrint, false);
  assert.equal(decoded.showThumbnails, false);
  assert.equal(decoded.passwordProtected, true);
  assert.equal(decoded.password, 'kunci2026');
  assert.equal(decoded.readerTheme, 'archival');
});

test('verifyBookPassword enforces password protection correctly', () => {
  const lockedConfig = { passwordProtected: true, password: 'rahasia123' };
  assert.equal(verifyBookPassword(lockedConfig, '').unlocked, false);
  assert.equal(verifyBookPassword(lockedConfig, 'salah').unlocked, false);
  assert.equal(verifyBookPassword(lockedConfig, 'rahasia123').unlocked, true);

  const openConfig = { passwordProtected: false, password: '' };
  assert.equal(verifyBookPassword(openConfig, '').unlocked, true);
});

test('validatePdfUrlInput rejects malformed URLs and accepts valid HTTPS URLs', () => {
  assert.equal(validatePdfUrlInput('').valid, false);
  assert.equal(validatePdfUrlInput('bukan-url').valid, false);
  assert.equal(validatePdfUrlInput('ftp://files.example.com/doc.pdf').valid, false);
  assert.equal(validatePdfUrlInput('https://example.com/katalog.pdf').valid, true);
});

test('generateMinimalValidPdfBytes produces valid PDF header and EOF trailer', () => {
  const preset = PRESET_EDITIONS['arch-light'];
  const bytes = generateMinimalValidPdfBytes(DEFAULT_BOOK_CONFIG, preset.chapters);
  assert.ok(bytes.byteLength > 1000);
  const text = new TextDecoder().decode(bytes);
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.ok(text.trimEnd().endsWith('%%EOF'));
});
