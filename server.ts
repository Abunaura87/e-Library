import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const BOOKS_DIR = path.join(DATA_DIR, 'books');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BOOKS_DIR)) {
  fs.mkdirSync(BOOKS_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '60mb' }));

  // Centralized catalog API for seamless cross-account & multi-user persistence
  app.get('/api/catalog', (req, res) => {
    try {
      if (fs.existsSync(CATALOG_FILE)) {
        const raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
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

      const record = {
        ...payload,
        updatedAt: payload.updatedAt || Date.now()
      };
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(record, null, 2), 'utf-8');
      return res.json({ success: true, count: payload.books.length, updatedAt: record.updatedAt });
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
