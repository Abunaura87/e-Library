import pdfProxyHandler from './api/pdf-proxy.js';
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
      const publicRead = req.path === '/gas' && ['readBook','recordBookVisit'].includes(parseIncomingBody(req).action);
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

  // Use the same validated PDF download behavior in preview and production.
  app.get('/api/pdf-proxy', pdfProxyHandler);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'e-Library Cloud Database Sync Server' });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  // Parse explicit --port argument if provided (e.g. npm run dev --port 3000)
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : NaN;
  // If running inside container where Nginx uses 8080, dev server must run on port 3000
  const port = !isNaN(cliPort)
    ? cliPort
    : (process.env.APP_PORT
      ? parseInt(process.env.APP_PORT, 10)
      : (process.env.PORT && process.env.PORT !== '8080' ? parseInt(process.env.PORT, 10) : 3000));

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

    // Fallback for SPA HTML routing
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite && typeof vite.ssrFixStacktrace === 'function') {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  let activeServer: any = null;

  const startHttpServer = (targetPort: number, attemptsLeft = 10) => {
    activeServer = app.listen(targetPort, '0.0.0.0', () => {
      console.log(`e-Library Cloud Database Server running on http://0.0.0.0:${targetPort}`);
    });

    activeServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${targetPort} is currently in use.`);
        if (attemptsLeft > 0) {
          console.log(`Retrying on port ${targetPort} in 1 second... (${attemptsLeft} attempts remaining)`);
          setTimeout(() => {
            try {
              if (activeServer) {
                activeServer.close(() => {
                  startHttpServer(targetPort, attemptsLeft - 1);
                });
              } else {
                startHttpServer(targetPort, attemptsLeft - 1);
              }
            } catch (_) {
              startHttpServer(targetPort, attemptsLeft - 1);
            }
          }, 1000);
        } else {
          console.error(`Port ${targetPort} could not be bound after retries. Dev server requires port ${targetPort}.`);
          process.exit(1);
        }
      } else {
        console.error('Server error:', err);
      }
    });
  };

  const handleTermination = (signal: string) => {
    console.log(`Received ${signal}, closing server gracefully...`);
    if (activeServer) {
      try {
        activeServer.close(() => {
          process.exit(0);
        });
      } catch (_) {
        process.exit(0);
      }
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleTermination('SIGINT'));
  process.on('SIGTERM', () => handleTermination('SIGTERM'));

  startHttpServer(port);
}

startServer();
