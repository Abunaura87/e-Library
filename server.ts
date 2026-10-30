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

function getSafeServerTimestamp(clientTs?: any): number {
  const num = Number(clientTs) || 0;
  if (num > 0 && num <= 1785000000000) return Math.floor(num);
  const now = Date.now();
  return now > 1785000000000 ? 1000 + (now % 1000000) : now;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '60mb' }));

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
      if (fs.existsSync(CATALOG_FILE)) {
        try {
          const prev = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
          if (prev && Array.isArray(prev.deletedBookIds)) {
            existingDeleted = prev.deletedBookIds;
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
            updatedAt: getSafeServerTimestamp(payload.musicConfig.updatedAt || payload.updatedAt)
          };
          fs.writeFileSync(MUSIC_FILE, JSON.stringify(nextMusic, null, 2), 'utf-8');
        } catch (e) {}
      }

      const record = {
        ...payload,
        books: cleanBooks,
        bookOrder: cleanBookOrder,
        deletedBookIds: Array.from(deletedSet),
        updatedAt: getSafeServerTimestamp(payload.updatedAt)
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

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'e-Library Cloud Database Sync Server' });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`e-Library Cloud Database Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
