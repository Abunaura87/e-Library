import { Writable } from 'node:stream';
import gasHandler from './api/gas.js';
import musicHandler from './api/music.js';
import brandingHandler from './api/branding.js';
import pdfHandler from './api/pdf-proxy.js';

// Reuse the existing authenticated handlers on both hosting platforms.
// No catalog, credentials or user data is stored in the static asset bundle.
const handlers = new Map([
  ['/api/gas', gasHandler], ['/api/music', musicHandler],
  ['/api/branding', brandingHandler], ['/api/pdf-proxy', pdfHandler],
]);
const MAX_BODY = 16 * 1024 * 1024;

export async function adaptHandler(handler, request, overrides = {}) {
  const url = new URL(request.url);
  const req = { method: request.method, url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers),
    query: Object.fromEntries(url.searchParams), ...overrides };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !('body' in overrides)) {
    if (Number(request.headers.get('content-length')) > MAX_BODY) {
      return Response.json({status:'error', message:'Berkas terlalu besar. Gunakan unggahan bertahap.'}, {status:413});
    }
    const reader = request.body?.getReader();
    const chunks = []; let size = 0;
    if (reader) {
      while (true) {
        const {done, value} = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY) { await reader.cancel(); return Response.json({status:'error', message:'Berkas terlalu besar. Gunakan unggahan bertahap.'}, {status:413}); }
        chunks.push(value);
      }
    }
    req.body = Buffer.concat(chunks, size).toString('utf8');
  }
  return new Promise(resolve => {
    const headers = new Headers(); let status = 200, committed = false, writer;
    const stream = new TransformStream();
    const res = new Writable({
      write(chunk, encoding, callback) {
        commit();
        writer.write(new Uint8Array(chunk)).then(() => callback(), callback);
      },
      final(callback) {
        commit(); writer.close().then(() => callback(), callback);
      },
      destroy(error, callback) {
        if (writer) writer.abort(error).catch(() => {});
        if (!committed) { status = 502; headers.set('Content-Type','application/json'); committed = true;
          resolve(new Response(JSON.stringify({status:'error', message:'Layanan cloud belum merespons.'}), {status, headers})); }
        callback(error);
      },
    });
    function commit() {
      if (committed) return;
      committed = true; writer = stream.writable.getWriter();
      resolve(new Response([204,205,304].includes(status) || request.method === 'HEAD' ? null : stream.readable, {status, headers}));
      if ([204,205,304].includes(status) || request.method === 'HEAD') stream.readable.cancel().catch(() => {});
    }
    Object.defineProperty(res,'headersSent',{get:()=>committed});
    res.setHeader = (name,value) => { if (!committed) headers.set(name,String(value)); return res; };
    res.getHeader = name => headers.get(name);
    res.status = value => { status = value; return res; };
    res.json = value => {res.setHeader('Content-Type','application/json; charset=utf-8'); res.end(JSON.stringify(value)); return res;};
    res.send = value => {res.end(value); return res;};
    res.on('error', () => {});
    const abort = () => res.destroy(new Error('Client disconnected'));
    request.signal.addEventListener('abort', abort, {once:true});
    res.on('close', () => request.signal.removeEventListener('abort', abort));
    Promise.resolve().then(() => handler(req,res)).then(() => {
      if (!res.writableEnded) res.end();
    }).catch(error => { res.destroy(error); });
  });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const handler = handlers.get(path);
    if (handler) return adaptHandler(handler,request);
    if (path === '/api/health') return Response.json({status:'ok',service:'e-Library Cloudflare',databaseConfigured:!!(env.GAS_WEB_APP_URL || env.SCRIPT_API_URL)});
    if (path === '/api/catalog' && request.method === 'GET') return adaptHandler(gasHandler,request);
    const book = path.match(/^\/api\/books\/([^/]+)$/);
    if (book && request.method === 'GET') {
      const response = await adaptHandler(gasHandler,request,{method:'POST',body:{action:'readBook',id:decodeURIComponent(book[1])}});
      const value = await response.json();
      return Response.json(value.book || value,{status:response.status,headers:response.headers});
    }
    if (path.startsWith('/api/')) return Response.json({status:'error',message:'API tidak tersedia. Gunakan endpoint operasi individual.'},{status:404});
    return env.ASSETS.fetch(request);
  },
};
