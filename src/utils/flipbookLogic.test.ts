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
  evaluateAdminAccess,
  DEFAULT_ADMIN_INITIAL_PASSWORD,
  computeAdminPasswordHash,
  verifyAdminEmailAndPassword,
  validateAdminPasswordChange,
  validateAdminPasswordResetEmail,
  validateVerifiedPasswordResetSubmission,
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

test('evaluateAdminAccess enforces single email whitelist for marhaniza05@gmail.com', () => {
  const allowed = evaluateAdminAccess('  Marhaniza05@gmail.com ');
  assert.equal(allowed.authorized, true);
  assert.equal(allowed.normalizedEmail, 'marhaniza05@gmail.com');

  const deniedOther = evaluateAdminAccess('other.user@gmail.com');
  assert.equal(deniedOther.authorized, false);
  assert.equal(
    deniedOther.message,
    'Akses Ditolak: Akun Anda tidak memiliki izin sebagai Administrator'
  );

  const deniedEmpty = evaluateAdminAccess('   ');
  assert.equal(deniedEmpty.authorized, false);
});

test('verifyAdminEmailAndPassword strictly blocks email-only bypass and enforces password hash', () => {
  // Knowing marhaniza05@gmail.com WITHOUT password MUST be strictly rejected
  const noPasswordAttempt = verifyAdminEmailAndPassword('marhaniza05@gmail.com', '');
  assert.equal(noPasswordAttempt.authorized, false);

  // Knowing marhaniza05@gmail.com with WRONG password MUST be strictly rejected
  const wrongPasswordAttempt = verifyAdminEmailAndPassword('marhaniza05@gmail.com', 'tebakSandi123');
  assert.equal(wrongPasswordAttempt.authorized, false);

  // Non-whitelisted email even with right password MUST be strictly rejected
  const wrongEmailRightPass = verifyAdminEmailAndPassword(
    'intruder@gmail.com',
    DEFAULT_ADMIN_INITIAL_PASSWORD
  );
  assert.equal(wrongEmailRightPass.authorized, false);
  assert.equal(
    wrongEmailRightPass.message,
    'Akses Ditolak: Akun Anda tidak memiliki izin sebagai Administrator'
  );

  // Correct whitelisted email + correct password succeeds
  const validInitial = verifyAdminEmailAndPassword(
    'marhaniza05@gmail.com',
    DEFAULT_ADMIN_INITIAL_PASSWORD
  );
  assert.equal(validInitial.authorized, true);
});

test('validateAdminPasswordChange updates password hash and rejects old password afterwards', () => {
  const changeFailWrongCurrent = validateAdminPasswordChange(
    'SandiSalah',
    'SandiBaruAman#99',
    'SandiBaruAman#99'
  );
  assert.equal(changeFailWrongCurrent.valid, false);

  const changeFailShort = validateAdminPasswordChange(
    DEFAULT_ADMIN_INITIAL_PASSWORD,
    '123',
    '123'
  );
  assert.equal(changeFailShort.valid, false);

  const changeSuccess = validateAdminPasswordChange(
    DEFAULT_ADMIN_INITIAL_PASSWORD,
    'SandiBaruAman#99',
    'SandiBaruAman#99'
  );
  assert.equal(changeSuccess.valid, true);
  assert.ok(changeSuccess.newHash);

  // After changing password, old password fails and new password succeeds
  assert.equal(
    verifyAdminEmailAndPassword(
      'marhaniza05@gmail.com',
      DEFAULT_ADMIN_INITIAL_PASSWORD,
      changeSuccess.newHash
    ).authorized,
    false
  );
  assert.equal(
    verifyAdminEmailAndPassword(
      'marhaniza05@gmail.com',
      'SandiBaruAman#99',
      changeSuccess.newHash
    ).authorized,
    true
  );
  assert.equal(computeAdminPasswordHash('SandiBaruAman#99'), changeSuccess.newHash);
});

test('validateAdminPasswordResetEmail strictly enforces whitelist before sending reset email', () => {
  const emptyCheck = validateAdminPasswordResetEmail('   ');
  assert.equal(emptyCheck.allowed, false);
  assert.equal(emptyCheck.continueUrl, '');

  const nonWhitelisted = validateAdminPasswordResetEmail('intruder@gmail.com', 'https://elibrary.example.com/');
  assert.equal(nonWhitelisted.allowed, false);
  assert.equal(nonWhitelisted.continueUrl, '');
  assert.ok(nonWhitelisted.message.includes('Akses Ditolak'));

  const whitelisted = validateAdminPasswordResetEmail('  Marhaniza05@gmail.com ', 'https://elibrary.example.com/');
  assert.equal(whitelisted.allowed, true);
  assert.equal(whitelisted.normalizedEmail, 'marhaniza05@gmail.com');
  assert.equal(
    whitelisted.continueUrl,
    'https://elibrary.example.com/?adminResetVerify=1&email=marhaniza05%40gmail.com'
  );
});

test('validateVerifiedPasswordResetSubmission enforces whitelist and updates password hash', () => {
  const intruderReset = validateVerifiedPasswordResetSubmission(
    'intruder@gmail.com',
    'SandiResetBaru#2026',
    'SandiResetBaru#2026'
  );
  assert.equal(intruderReset.valid, false);

  const mismatchReset = validateVerifiedPasswordResetSubmission(
    'marhaniza05@gmail.com',
    'SandiResetBaru#2026',
    'SandiBeda#2026'
  );
  assert.equal(mismatchReset.valid, false);

  const validReset = validateVerifiedPasswordResetSubmission(
    'marhaniza05@gmail.com',
    'SandiResetBaru#2026',
    'SandiResetBaru#2026'
  );
  assert.equal(validReset.valid, true);
  assert.equal(validReset.newHash, computeAdminPasswordHash('SandiResetBaru#2026'));
});


