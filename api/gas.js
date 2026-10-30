// Vercel Serverless Function for /api/gas (Google Apps Script compatible API)
// Provides seamless cross-account & public catalog sync on Vercel deployments

import fs from 'fs';
import path from 'path';

let inMemoryCatalog = null;

function getCatalog() {
  if (inMemoryCatalog) return inMemoryCatalog;
  try {
    const catalogPath = path.join(process.cwd(), 'data', 'catalog.json');
    if (fs.existsSync(catalogPath)) {
      inMemoryCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      return inMemoryCatalog;
    }
  } catch (e) {}

  return {
    shelves: [
      { id: 'rak-01', code: 'MOTIVASI DAN INSPIRASI', name: 'Motivasi, Inspirasi & Pengembangan Diri', description: 'Koleksi buku motivasi islami, pengembangan karakter, biografi tokoh inspiratif, dan penguat jiwa.', accent: '#0B3B2C', colSpan: 'lg:col-span-4', bookStyle: 'leaning-left', orderIndex: 0, updatedAt: Date.now(), isCustomEdited: true },
      { id: 'rak-02', code: 'FIQH WANITA', name: 'Fiqh Wanita dan Hukum Muslimah', description: 'Koleksi kitab dan buku yang membahas hukum-hukum Islam berkaitan dengan perempuan Muslimah, meliputi thaharah, ibadah, keluarga, dan keteladanan shahabiyah.', accent: '#14532D', colSpan: 'lg:col-span-4', bookStyle: 'stacked-and-leaning', orderIndex: 1, updatedAt: Date.now(), isCustomEdited: true }
    ],
    books: [
      { id: 'book-pdf-1793311132578', shelfId: 'rak-01', rackId: 'rak-01', title: '200 Motivasi Nabi & Kisah Inspiratif Pembangun Jiwa -- As-Samarqandi', author: 'Abu Laits As-Samarqandi', description: 'Koleksi 200 motivasi nabawi dan kisah keteladanan salafush shalih yang menggugah jiwa dan memperkuat akhlak mulia.', kicker: 'MOTIVASI NABAWI', pageCount: 8, passwordProtected: false, password: '', accent: '#0B3B2C', spineColor: '#0B3B2C', hasCustomCoverImage: true, isCustomPdf: true, coverUrl: '', driveFileId: '', drivePdfFileId: '', updatedAt: Date.now() },
      { id: 'book-wanita-teladan-1', shelfId: 'rak-02', rackId: 'rak-02', title: 'Kisah Wanita Wanita Teladan', author: 'Abdullah Haidir', description: 'Ringkasan kuratorial dan pokok bahasan utama buku dalam etalase koleksi 3D.', kicker: 'TELADAN MUSLIMAH', pageCount: 34, passwordProtected: false, password: '', accent: '#14532D', spineColor: '#14532D', hasCustomCoverImage: true, isCustomPdf: true, coverUrl: '', driveFileId: '', drivePdfFileId: '', updatedAt: Date.now() }
    ],
    deletedBookIds: ['book-kurikulum', 'book-metodologi', 'book-manuskrip', 'book-fiqih', 'book-arch', 'book-interior', 'book-botani', 'book-filsafat', 'book-tipografi', 'book-sosiologi', 'book-teknologi'],
    customScriptApiUrl: '',
    updatedAt: Date.now()
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const cat = getCatalog();
  const deletedSet = new Set(Array.isArray(cat.deletedBookIds) ? cat.deletedBookIds.map(String) : []);

  if (req.method === 'GET') {
    const cleanBooks = (Array.isArray(cat.books) ? cat.books : []).filter(
      (b) => b && b.id && b.id !== 'elibrary-system-settings' && !deletedSet.has(String(b.id))
    );
    const racks = Array.isArray(cat.shelves) ? cat.shelves : (Array.isArray(cat.racks) ? cat.racks : []);
    return res.status(200).json({
      status: 'success',
      racks,
      shelves: racks,
      books: cleanBooks,
      deletedBookIds: Array.from(deletedSet),
      customScriptApiUrl: cat.customScriptApiUrl || '',
      updatedAt: cat.updatedAt || Date.now()
    });
  }

  if (req.method === 'POST') {
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (e) { payload = {}; }
    }
    payload = payload || {};
    const action = String(payload.action || '').trim();

    if (action === 'saveBook') {
      const b = payload.book || payload;
      if (b && b.id) {
        const bookId = String(b.id);
        cat.deletedBookIds = (cat.deletedBookIds || []).filter((id) => String(id) !== bookId);
        const shelfId = String(b.shelfId || b.rackId || 'rak-01');
        const bookMeta = {
          id: bookId,
          rackId: shelfId,
          shelfId: shelfId,
          title: String(b.title || 'Buku Koleksi'),
          author: String(b.author || 'Anonim'),
          description: String(b.description || ''),
          kicker: String(b.kicker || ''),
          accent: String(b.accent || '#0B3B2C'),
          spineColor: String(b.spineColor || b.accent || '#0B3B2C'),
          pageCount: Number(b.pageCount) || 1,
          passwordProtected: Boolean(b.passwordProtected && b.password),
          password: b.passwordProtected ? String(b.password || '').trim() : '',
          coverUrl: String(b.coverUrl || ''),
          pdfUrl: String(b.pdfUrl || ''),
          hasCustomCoverImage: Boolean(b.hasCustomCoverImage || b.isCustomPdf || b.coverUrl),
          isCustomPdf: Boolean(b.isCustomPdf || b.pdfUrl),
          driveFileId: String(b.driveFileId || ''),
          drivePdfFileId: String(b.drivePdfFileId || ''),
          editablePages: Array.isArray(b.editablePages) ? b.editablePages : undefined,
          updatedAt: Date.now()
        };
        const existingIdx = (cat.books || []).findIndex((item) => item && item.id === bookId);
        if (existingIdx >= 0) {
          cat.books[existingIdx] = { ...cat.books[existingIdx], ...bookMeta };
        } else {
          cat.books.unshift(bookMeta);
        }
        cat.bookOrder = cat.books.map((item) => item.id);
        cat.updatedAt = Date.now();
        inMemoryCatalog = cat;
        return res.status(200).json({ status: 'success', action, book: bookMeta, count: cat.books.length });
      }
    }

    if (action === 'deleteBook') {
      const rawId = String(payload.id || (payload.book && payload.book.id) || '').trim();
      if (rawId) {
        cat.books = (cat.books || []).filter((b) => b && b.id !== rawId);
        if (!cat.deletedBookIds.includes(rawId)) cat.deletedBookIds.push(rawId);
        cat.updatedAt = Date.now();
        inMemoryCatalog = cat;
        return res.status(200).json({ status: 'success', action, deletedId: rawId, count: cat.books.length });
      }
    }

    if (action === 'saveRack') {
      if (Array.isArray(payload.racks) && payload.racks.length > 0) {
        cat.shelves = payload.racks;
      }
      cat.updatedAt = Date.now();
      inMemoryCatalog = cat;
      return res.status(200).json({ status: 'success', action, racks: cat.shelves });
    }

    if (action === 'syncAll') {
      if (Array.isArray(payload.racks)) cat.shelves = payload.racks;
      if (Array.isArray(payload.books)) {
        const del = new Set((payload.deletedBookIds || []).map(String));
        cat.books = payload.books.filter((b) => b && b.id && !del.has(String(b.id)));
      }
      if (Array.isArray(payload.deletedBookIds)) cat.deletedBookIds = payload.deletedBookIds;
      cat.updatedAt = Date.now();
      inMemoryCatalog = cat;
      return res.status(200).json({ status: 'success', action, count: (cat.books || []).length });
    }

    return res.status(200).json({ status: 'success', action });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
