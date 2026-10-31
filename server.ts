import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const MUSIC_FILE = path.join(DATA_DIR, 'music.json');
const BOOKS_DIR = path.join(DATA_DIR, 'books');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BOOKS_DIR)) {
  fs.mkdirSync(BOOKS_DIR, { recursive: true });
}

function getSafeServerTimestamp(clientTs?: any, minTs?: number): number {
  const num = Number(clientTs) || 0;
  const now = Date.now();
  const base = num > 0 ? Math.floor(num) : now;
  return minTs && base <= minTs ? minTs + 1 : base;
}

async function startServer() {
  const app = express();

  // Global CORS support so external frontends (e.g. e-library-digital.vercel.app & mobile browsers)
  // can seamlessly read and write to this centralized Cloud Run API server
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  app.use(express.json({ limit: '60mb' }));
  app.use(express.text({ type: ['text/plain', 'text/*'], limit: '60mb' }));

  function parseIncomingBody(req: express.Request): any {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch (e) {
        return {};
      }
    }
    return req.body;
  }

  function loadCatalogRecord(): any {
    if (fs.existsSync(CATALOG_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
      } catch (e) {}
    }
    return {
      shelves: [],
      books: [],
      bookOrder: [],
      deletedBookIds: [],
      customScriptApiUrl: '',
      updatedAt: Date.now()
    };
  }

  function saveCatalogRecord(record: any): void {
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(record, null, 2), 'utf-8');
  }

  // Google Apps Script (GAS) Web App Compatible Endpoint (GET & POST)
  // Supports exact GAS Web App protocol: GET returns { status: 'success', racks, books }
  // POST accepts action: 'saveRack' | 'deleteRack' | 'saveBook' | 'deleteBook' | 'syncAll' | 'setScriptUrl'
  app.get('/api/gas', (req, res) => {
    try {
      const cat = loadCatalogRecord();
      const deletedSet = new Set<string>(Array.isArray(cat.deletedBookIds) ? cat.deletedBookIds.map(String) : []);
      const cleanBooks = (Array.isArray(cat.books) ? cat.books : []).filter(
        (b: any) => b && b.id && b.id !== 'elibrary-system-settings' && !deletedSet.has(String(b.id))
      );
      const racks = Array.isArray(cat.shelves) ? cat.shelves : (Array.isArray(cat.racks) ? cat.racks : []);
      return res.json({
        status: 'success',
        racks,
        shelves: racks,
        books: cleanBooks,
        deletedBookIds: Array.from(deletedSet),
        customScriptApiUrl: cat.customScriptApiUrl || '',
        updatedAt: cat.updatedAt || Date.now()
      });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.post('/api/gas', (req, res) => {
    try {
      const payload = parseIncomingBody(req);
      const action = String(payload.action || '').trim();
      const cat = loadCatalogRecord();
      if (!Array.isArray(cat.shelves)) cat.shelves = [];
      if (!Array.isArray(cat.books)) cat.books = [];
      if (!Array.isArray(cat.deletedBookIds)) cat.deletedBookIds = [];

      if (action === 'setScriptUrl') {
        cat.customScriptApiUrl = String(payload.scriptApiUrl || '').trim();
        cat.updatedAt = getSafeServerTimestamp(payload.updatedAt, cat.updatedAt);
        saveCatalogRecord(cat);
        return res.json({ status: 'success', action, customScriptApiUrl: cat.customScriptApiUrl });
      }

      if (action === 'saveRack') {
        if (Array.isArray(payload.racks) && payload.racks.length > 0) {
          cat.shelves = payload.racks;
        } else if (payload.rack && payload.rack.id) {
          const r = payload.rack;
          const idx = cat.shelves.findIndex((s: any) => s && s.id === r.id);
          const rackRecord = {
            id: String(r.id),
            code: String(r.code || 'KLASIKAL'),
            name: String(r.name || r.title || 'Rak Koleksi'),
            description: String(r.description || ''),
            accent: String(r.accent || '#0B3B2C'),
            colSpan: String(r.colSpan || 'lg:col-span-4'),
            bookStyle: String(r.bookStyle || 'standing-row'),
            orderIndex: typeof r.orderIndex === 'number' ? r.orderIndex : (idx >= 0 ? idx : cat.shelves.length),
            updatedAt: getSafeServerTimestamp(r.updatedAt),
            isCustomEdited: true
          };
          if (idx >= 0) {
            cat.shelves[idx] = { ...cat.shelves[idx], ...rackRecord };
          } else {
            cat.shelves.push(rackRecord);
          }
        }
        cat.updatedAt = getSafeServerTimestamp(payload.updatedAt, cat.updatedAt);
        saveCatalogRecord(cat);
        return res.json({ status: 'success', action, racks: cat.shelves });
      }

      if (action === 'deleteRack') {
        const rackId = String(payload.id || (payload.rack && payload.rack.id) || '').trim();
        if (rackId) {
          cat.shelves = cat.shelves.filter((s: any) => s && s.id !== rackId);
          const fallbackId = (cat.shelves[0] && cat.shelves[0].id) || 'rak-01';
          cat.books.forEach((b: any) => {
            if (b && (b.shelfId === rackId || b.rackId === rackId)) {
              b.shelfId = fallbackId;
              b.rackId = fallbackId;
            }
          });
          cat.updatedAt = getSafeServerTimestamp(payload.updatedAt, cat.updatedAt);
          saveCatalogRecord(cat);
        }
        return res.json({ status: 'success', action, id: rackId, racks: cat.shelves });
      }

      if (action === 'saveBook') {
        const b = payload.book || payload;
        if (!b || !b.id) {
          return res.status(400).json({ status: 'error', message: 'Missing book id' });
        }
        const bookId = String(b.id);
        cat.deletedBookIds = cat.deletedBookIds.filter((delId: string) => String(delId) !== bookId);
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
          updatedAt: getSafeServerTimestamp(b.updatedAt)
        };
        const existingIdx = cat.books.findIndex((item: any) => item && item.id === bookId);
        if (existingIdx >= 0) {
          cat.books[existingIdx] = { ...cat.books[existingIdx], ...bookMeta };
        } else {
          cat.books.unshift(bookMeta);
        }
        cat.bookOrder = cat.books.map((item: any) => item.id);
        cat.updatedAt = getSafeServerTimestamp(payload.updatedAt, cat.updatedAt);
        saveCatalogRecord(cat);

        // Save full book asset if pages or asset payload provided
        const safeId = bookId.replace(/[^a-zA-Z0-9_\-]/g, '-');
        const bookPath = path.join(BOOKS_DIR, `${safeId}.json`);
        if (payload.asset || Array.isArray(b.pagesDataUrls) || Array.isArray(b.editablePages)) {
          try {
            const fullAsset = payload.asset || b;
            fs.writeFileSync(bookPath, JSON.stringify(fullAsset, null, 2), 'utf-8');
          } catch (e) {}
        }
        return res.json({ status: 'success', action, book: bookMeta, count: cat.books.length });
      }

      if (action === 'deleteBook') {
        const rawId = String(payload.id || (payload.book && payload.book.id) || '').trim();
        if (!rawId) {
          return res.status(400).json({ status: 'error', message: 'Missing book id to delete' });
        }
        const safeId = rawId.replace(/[^a-zA-Z0-9_\-]/g, '-');
        const bookPath = path.join(BOOKS_DIR, `${safeId}.json`);
        if (fs.existsSync(bookPath)) {
          try { fs.unlinkSync(bookPath); } catch (e) {}
        }
        cat.books = cat.books.filter((b: any) => b && b.id !== rawId && b.id !== safeId);
        if (Array.isArray(cat.bookOrder)) {
          cat.bookOrder = cat.bookOrder.filter((id: any) => id !== rawId && id !== safeId);
        }
        if (!cat.deletedBookIds.includes(rawId)) {
          cat.deletedBookIds.push(rawId);
        }
        cat.updatedAt = getSafeServerTimestamp(payload.updatedAt, cat.updatedAt);
        saveCatalogRecord(cat);
        return res.json({ status: 'success', action, deletedId: rawId, count: cat.books.length });
      }

      if (action === 'syncAll') {
        if (Array.isArray(payload.racks) && payload.racks.length > 0) {
          cat.shelves = payload.racks;
        } else if (Array.isArray(payload.shelves) && payload.shelves.length > 0) {
          cat.shelves = payload.shelves;
        }
        if (Array.isArray(payload.deletedBookIds)) {
          payload.deletedBookIds.forEach((delId: string) => {
            if (delId && !cat.deletedBookIds.includes(String(delId))) {
              cat.deletedBookIds.push(String(delId));
            }
          });
        }
        if (Array.isArray(payload.books)) {
          const delSet = new Set<string>(cat.deletedBookIds.map(String));
          cat.books = payload.books.filter((b: any) => b && b.id && !delSet.has(String(b.id)));
          cat.bookOrder = cat.books.map((b: any) => b.id);
        }
        cat.updatedAt = getSafeServerTimestamp(payload.updatedAt, cat.updatedAt);
        saveCatalogRecord(cat);
        return res.json({ status: 'success', action, count: cat.books.length, rackCount: cat.shelves.length });
      }

      return res.status(400).json({ status: 'error', message: `Unsupported action: ${action}` });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Centralized catalog API for seamless cross-account & multi-user persistence
  app.get('/api/catalog', (req, res) => {
    try {
      if (fs.existsSync(CATALOG_FILE)) {
        const raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
        const cat = JSON.parse(raw);
        if (fs.existsSync(MUSIC_FILE)) {
          try {
            const musicRaw = JSON.parse(fs.readFileSync(MUSIC_FILE, 'utf-8'));
            cat.musicConfig = {
              theme: musicRaw.theme || 'library',
              volume: typeof musicRaw.volume === 'number' ? musicRaw.volume : 0.5,
              customUrl: musicRaw.customUrl || '',
              fileName: musicRaw.fileName || '',
              mimeType: musicRaw.mimeType || 'audio/mpeg',
              isPlaying: Boolean(musicRaw.isPlaying),
              hasCustomAudioData: Boolean(musicRaw.audioDataUrl),
              updatedAt: musicRaw.updatedAt || 1000
            };
          } catch (e) {}
        }
        return res.json(cat);
      }
      return res.status(404).json({ error: 'Catalog not found' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/catalog', (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.shelves || !payload.books) {
        return res.status(400).json({ error: 'Invalid catalog payload' });
      }

      let existingDeleted: string[] = [];
      let prevUpdatedAt = 0;
      if (fs.existsSync(CATALOG_FILE)) {
        try {
          const prev = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
          if (prev && Array.isArray(prev.deletedBookIds)) {
            existingDeleted = prev.deletedBookIds;
          }
          if (prev && Number(prev.updatedAt) > 0) {
            prevUpdatedAt = Number(prev.updatedAt);
          }
        } catch (e) {}
      }

      const incomingBookIds = new Set<string>(
        (payload.books || []).map((b: any) => (b && b.id ? String(b.id) : '')).filter(Boolean)
      );
      const deletedSet = new Set<string>([
        ...existingDeleted.filter((id) => !incomingBookIds.has(String(id))),
        ...(Array.isArray(payload.deletedBookIds) ? payload.deletedBookIds : [])
      ]);

      // Clean up any files in BOOKS_DIR for deleted books
      deletedSet.forEach((delId: string) => {
        const safeDelId = String(delId).replace(/[^a-zA-Z0-9_\-]/g, '-');
        const p = path.join(BOOKS_DIR, `${safeDelId}.json`);
        if (fs.existsSync(p)) {
          try { fs.unlinkSync(p); } catch (e) {}
        }
      });

      // Filter out any deleted books or system settings pseudo-docs from catalog
      const cleanBooks = payload.books.filter(
        (b: any) => b && b.id && b.id !== 'elibrary-system-settings' && !deletedSet.has(String(b.id))
      );
      const cleanBookOrder = Array.isArray(payload.bookOrder)
        ? payload.bookOrder.filter((id: any) => id !== 'elibrary-system-settings' && !deletedSet.has(String(id)))
        : cleanBooks.map((b: any) => b.id);

      // Ensure each book in cleanBooks also has a fallback file in BOOKS_DIR if not already present
      cleanBooks.forEach((b: any) => {
        if (!b || !b.id) return;
        const safeId = String(b.id).replace(/[^a-zA-Z0-9_\-]/g, '-');
        const bookPath = path.join(BOOKS_DIR, `${safeId}.json`);
        if (!fs.existsSync(bookPath) && (Array.isArray(b.editablePages) || Array.isArray(b.pagesDataUrls) || b.coverUrl)) {
          try {
            fs.writeFileSync(bookPath, JSON.stringify(b, null, 2), 'utf-8');
          } catch (e) {}
        }
      });

      if (payload.musicConfig && typeof payload.musicConfig === 'object') {
        try {
          let existingMusic: any = {};
          if (fs.existsSync(MUSIC_FILE)) {
            existingMusic = JSON.parse(fs.readFileSync(MUSIC_FILE, 'utf-8'));
          }
          const nextMusic = {
            ...existingMusic,
            ...payload.musicConfig,
            audioDataUrl: payload.musicConfig.audioDataUrl || existingMusic.audioDataUrl || '',
            updatedAt: getSafeServerTimestamp(payload.musicConfig.updatedAt || payload.updatedAt, Number(existingMusic.updatedAt) || 0)
          };
          fs.writeFileSync(MUSIC_FILE, JSON.stringify(nextMusic, null, 2), 'utf-8');
        } catch (e) {}
      }

      const record = {
        ...payload,
        books: cleanBooks,
        bookOrder: cleanBookOrder,
        deletedBookIds: Array.from(deletedSet),
        updatedAt: getSafeServerTimestamp(payload.updatedAt, prevUpdatedAt)
      };
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(record, null, 2), 'utf-8');
      return res.json({ success: true, count: cleanBooks.length, updatedAt: record.updatedAt, deletedCount: deletedSet.size });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Real-time Background Music & Custom Audio Storage API
  app.get('/api/music', (req, res) => {
    try {
      if (fs.existsSync(MUSIC_FILE)) {
        const raw = fs.readFileSync(MUSIC_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.json({
        theme: 'library',
        volume: 0.5,
        customUrl: '',
        fileName: '',
        mimeType: 'audio/mpeg',
        isPlaying: false,
        audioDataUrl: '',
        updatedAt: 1000
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/music', (req, res) => {
    try {
      const body = req.body || {};
      let prev: any = {};
      if (fs.existsSync(MUSIC_FILE)) {
        try { prev = JSON.parse(fs.readFileSync(MUSIC_FILE, 'utf-8')); } catch (e) {}
      }
      const next = {
        theme: body.theme !== undefined ? body.theme : (prev.theme || 'library'),
        volume: typeof body.volume === 'number' ? body.volume : (typeof prev.volume === 'number' ? prev.volume : 0.5),
        customUrl: body.customUrl !== undefined ? body.customUrl : (prev.customUrl || ''),
        fileName: body.fileName !== undefined ? body.fileName : (prev.fileName || ''),
        mimeType: body.mimeType !== undefined ? body.mimeType : (prev.mimeType || 'audio/mpeg'),
        isPlaying: body.isPlaying !== undefined ? Boolean(body.isPlaying) : Boolean(prev.isPlaying),
        audioDataUrl: body.audioDataUrl !== undefined ? body.audioDataUrl : (prev.audioDataUrl || ''),
        updatedAt: getSafeServerTimestamp(body.updatedAt)
      };
      fs.writeFileSync(MUSIC_FILE, JSON.stringify(next, null, 2), 'utf-8');
      return res.json({ success: true, updatedAt: next.updatedAt });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Book pages / asset storage API
  app.get('/api/books/:id', (req, res) => {
    try {
      const safeId = req.params.id.replace(/[^a-zA-Z0-9_\-]/g, '-');
      const bookPath = path.join(BOOKS_DIR, `${safeId}.json`);
      if (fs.existsSync(bookPath)) {
        const raw = fs.readFileSync(bookPath, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.status(404).json({ error: 'Book data not found' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/books/:id', (req, res) => {
    try {
      const safeId = req.params.id.replace(/[^a-zA-Z0-9_\-]/g, '-');
      const bookPath = path.join(BOOKS_DIR, `${safeId}.json`);
      fs.writeFileSync(bookPath, JSON.stringify(req.body, null, 2), 'utf-8');
      return res.json({ success: true, id: safeId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/books/:id', (req, res) => {
    try {
      const rawId = req.params.id;
      const safeId = rawId.replace(/[^a-zA-Z0-9_\-]/g, '-');
      const bookPath = path.join(BOOKS_DIR, `${safeId}.json`);
      if (fs.existsSync(bookPath)) {
        try { fs.unlinkSync(bookPath); } catch (e) {}
      }
      if (fs.existsSync(CATALOG_FILE)) {
        const raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
        const cat = JSON.parse(raw);
        if (cat && Array.isArray(cat.books)) {
          cat.books = cat.books.filter((b: any) => b.id !== rawId && b.id !== safeId);
          if (Array.isArray(cat.bookOrder)) {
            cat.bookOrder = cat.bookOrder.filter((id: any) => id !== rawId && id !== safeId);
          }
          if (!Array.isArray(cat.deletedBookIds)) cat.deletedBookIds = [];
          if (!cat.deletedBookIds.includes(rawId)) cat.deletedBookIds.push(rawId);
          cat.updatedAt = getSafeServerTimestamp();
          fs.writeFileSync(CATALOG_FILE, JSON.stringify(cat, null, 2), 'utf-8');
        }
      }
      return res.json({ success: true, deletedId: rawId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Public PDF & Google Drive Direct Stream Proxy for PDF.js CORS compatibility
  app.get('/api/pdf-proxy', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-PDF-Filename, Content-Disposition');
    try {
      const rawUrl = String(req.query.url || '').trim();
      const authToken = String(req.query.token || req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      if (!rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
        return res.status(400).json({ error: 'Invalid PDF URL' });
      }

      const filePathMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
      const queryIdMatch = rawUrl.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
      const driveId = (filePathMatch && filePathMatch[1]) || (queryIdMatch && queryIdMatch[1]) || '';
      const isDrive = Boolean(driveId && (rawUrl.includes('drive.google.com') || rawUrl.includes('docs.google.com') || rawUrl.includes('drive.usercontent.google.com')));

      const candidates: Array<{ url: string; headers?: Record<string, string> }> = [];
      if (isDrive && driveId) {
        if (authToken) {
          candidates.push({
            url: `https://www.googleapis.com/drive/v3/files/${driveId}?alt=media`,
            headers: { Authorization: `Bearer ${authToken}` }
          });
        }
        candidates.push({
          url: `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`
        });
        candidates.push({
          url: `https://drive.google.com/uc?export=download&confirm=t&id=${driveId}`
        });
      } else {
        candidates.push({ url: rawUrl });
      }

      const hasPdfMagicBytes = (buf: Buffer): boolean => {
        if (!buf || buf.length < 5) return false;
        const head = buf.subarray(0, Math.min(buf.length, 1024)).toString('latin1');
        return head.includes('%PDF-');
      };

      const extractFilename = (disp: string | null): string => {
        if (!disp) return '';
        const utf8Match = disp.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match && utf8Match[1]) {
          try {
            return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ''));
          } catch (e) {}
        }
        const plainMatch = disp.match(/filename="?([^";]+)"?/i);
        return plainMatch && plainMatch[1] ? plainMatch[1].trim() : '';
      };

      let isRestricted = false;
      let lastStatus = 502;

      for (const candidate of candidates) {
        try {
          const upstream = await fetch(candidate.url, {
            headers: Object.assign(
              {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Accept: 'application/pdf,application/octet-stream,*/*'
              },
              candidate.headers || {}
            ),
            redirect: 'follow'
          });
          lastStatus = upstream.status;
          const finalUrl = upstream.url || '';
          if (finalUrl.includes('accounts.google.com') || finalUrl.includes('ServiceLogin')) {
            isRestricted = true;
            continue;
          }
          if (!upstream.ok) {
            if (upstream.status === 401 || upstream.status === 403) {
              isRestricted = true;
            }
            continue;
          }

          const buf = Buffer.from(await upstream.arrayBuffer());
          if (hasPdfMagicBytes(buf)) {
            const fname = extractFilename(upstream.headers.get('content-disposition'));
            if (fname) {
              res.setHeader('X-PDF-Filename', encodeURIComponent(fname));
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.send(buf);
          }

          // Check if Google Drive returned a virus-scan confirmation HTML page with uuid/confirm
          const htmlPreview = buf.subarray(0, Math.min(buf.length, 16384)).toString('utf-8');
          if (htmlPreview.includes('accounts.google.com') || htmlPreview.includes('ServiceLogin')) {
            isRestricted = true;
            continue;
          }
          if (isDrive && driveId && htmlPreview.includes('download-form')) {
            const uuidMatch = htmlPreview.match(/name="uuid"\s+value="([^"]+)"/i);
            const confirmVal = (htmlPreview.match(/name="confirm"\s+value="([^"]+)"/i) || [])[1] || 't';
            if (uuidMatch && uuidMatch[1]) {
              const confirmUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=${encodeURIComponent(confirmVal)}&uuid=${encodeURIComponent(uuidMatch[1])}`;
              const retryRes = await fetch(confirmUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                redirect: 'follow'
              });
              if (retryRes.ok) {
                const retryBuf = Buffer.from(await retryRes.arrayBuffer());
                if (hasPdfMagicBytes(retryBuf)) {
                  const fname = extractFilename(retryRes.headers.get('content-disposition'));
                  if (fname) {
                    res.setHeader('X-PDF-Filename', encodeURIComponent(fname));
                  }
                  res.setHeader('Content-Type', 'application/pdf');
                  res.setHeader('Cache-Control', 'public, max-age=3600');
                  return res.send(retryBuf);
                }
              }
            }
          }
        } catch (innerErr) {
          // Try next candidate
        }
      }

      if (isRestricted) {
        return res.status(403).json({
          code: 'DRIVE_RESTRICTED',
          error: 'Akses file Google Drive masih "Dibatasi" (Restricted). Buka Google Drive -> Klik Bagikan (Share) -> Ubah Akses Umum menjadi "Siapa saja yang memiliki link" (Anyone with the link).'
        });
      }

      return res.status(lastStatus >= 400 ? lastStatus : 422).json({
        code: 'INVALID_PDF',
        error: 'Tautan tidak mengembalikan berkas PDF yang valid. Pastikan link mengarah langsung ke file PDF publik.'
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to proxy PDF' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'e-Library Cloud Database Sync Server' });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.static(path.join(__dirname, 'public')));

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port,
        hmr: false,
        ws: false,
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const startHttpServer = (targetPort: number, attemptsLeft = 5) => {
    const server = app.listen(targetPort, '0.0.0.0', () => {
      console.log(`e-Library Cloud Database Server running on http://0.0.0.0:${targetPort}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${targetPort} is currently in use.`);
        if (attemptsLeft > 0) {
          console.log(`Retrying on port ${targetPort} in 1 second... (${attemptsLeft} attempts remaining)`);
          setTimeout(() => {
            server.close();
            startHttpServer(targetPort, attemptsLeft - 1);
          }, 1000);
        } else {
          const fallbackPort = targetPort + 1;
          console.warn(`Falling back to port ${fallbackPort}...`);
          startHttpServer(fallbackPort, 5);
        }
      } else {
        console.error('Server error:', err);
      }
    });
  };

  startHttpServer(port);
}

startServer();
