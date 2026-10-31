import express from 'express';
import gasHandler, { verifyAdminRequest } from './api/gas.js';
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

  // Authenticate every mutation on the server; no IP/email/local-storage trust.
  app.use('/api', async (req, res, next) => {
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
      const publicRead = req.path === '/gas' && parseIncomingBody(req).action === 'readBook';
      if (!publicRead) {
        if (!await verifyAdminRequest(req)) return res.status(401).json({status:'error',message:'Admin authentication required'});
        (req as any).verifiedAdmin = true;
      }
    }
    next();
  });
  function verifyAdminAuth(req: express.Request): boolean { return (req as any).verifiedAdmin === true; }

  // Both aliases use exactly the same durable upstream.
  app.all('/api/gas', gasHandler);
  app.get('/api/catalog', gasHandler);
  app.post('/api/catalog', (req,res)=>res.status(410).json({status:'error',message:'Bulk catalog replacement disabled; use individual operations.'}));

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

  // Legacy asset paths read the same cloud record and never expose local snapshots.
  app.get('/api/books/:id', async (req,res)=>{
    const originalJson=res.json.bind(res);
    res.json=((value:any)=>originalJson(value && value.book ? value.book : value)) as any;
    return gasHandler({method:'POST',headers:req.headers,body:{action:'readBook',id:req.params.id}},res);
  });
  app.post('/api/books/:id',(req,res)=>res.status(410).json({status:'error',message:'Use saveBook with its asset in one durable operation.'}));
  app.delete('/api/books/:id',(req,res)=>gasHandler({method:'POST',headers:req.headers,body:{action:'deleteBook',id:req.params.id,requestId:parseIncomingBody(req).requestId}},res));

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
