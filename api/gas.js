// Durable proxy: Apps Script + Sheets/Drive are the only catalog source.
const ACTIONS = new Set(['saveBook','deleteBook','saveRack','deleteRack','readBook','uploadChunk','recordBookVisit']);
const FIREBASE_KEY = 'AIzaSyD10bfzaau3mEQND0-hqBSXyg2rRt1c0PM';
export async function verifyAdminRequest(req) {
 const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!token||token.length>10000)return false;
 try {const r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+FIREBASE_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token}),signal:AbortSignal.timeout(15000)});if(!r.ok)return false;const j=await r.json();const u=j.users&&j.users[0];return !!(u&&u.emailVerified&&!u.disabled&&String(u.email).toLowerCase()==='marhaniza05@gmail.com');}catch{return false;}
}
function publicCatalog(data) {
 const racks=Array.isArray(data.racks)?data.racks:data.shelves;
 if(data.status!=='success'||data.schemaVersion!==2||!Array.isArray(data.books)||!Array.isArray(racks))throw Error('INVALID_CLOUD_RESPONSE');
 const clean=data.books.map(b=>{const x={...b};delete x.password;delete x.passwordHash;delete x.secretKey;delete x.assetRefsJson;delete x.snapshotFileId;if(x.passwordProtected){for(const k of ['pdfUrl','driveFileId','drivePdfFileId','editablePages','editablePagesJson','pagesDataUrls','originalPagesDataUrls','pdfDataUrl'])delete x[k];}return x;});
 return {...data,racks,shelves:racks,books:clean};
}
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('CDN-Cache-Control','no-store');res.setHeader('Vercel-CDN-Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 if(req.method==='OPTIONS'){res.setHeader('Allow','GET, POST, OPTIONS');return res.status(204).end();}
 if(!['GET','POST'].includes(req.method))return res.status(405).json({status:'error',message:'Method not allowed'});
 try {
 const gasUrl=process.env.GAS_WEB_APP_URL||process.env.SCRIPT_API_URL||'';
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(gasUrl))return res.status(503).json({status:'error',code:'CLOUD_NOT_CONFIGURED',message:'Database cloud belum dikonfigurasi. Hubungi pengelola.'});

 if(req.method==='GET'&&req.query?.cover){
  const id=String(req.query.cover);if(!/^[a-zA-Z0-9_-]{10,150}$/.test(id))return res.status(400).end();
  const upstream=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'catalogCover',id}),redirect:'follow',signal:AbortSignal.timeout(60000)});
  if(!upstream.ok)return res.status(502).end();const image=await upstream.json();
  if(image.status!=='success')return res.status(image.code===404?404:502).end();
  const match=String(image.cover||'').match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if(!match)return res.status(404).end();
  res.setHeader('Content-Type',match[1]);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','public, max-age=86400, immutable');res.setHeader('CDN-Cache-Control','public, max-age=86400');res.setHeader('Vercel-CDN-Cache-Control','public, max-age=86400');
  return res.status(200).send(Buffer.from(match[2],'base64'));
 }

 let payload={};if(req.method==='POST'){try{payload=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return res.status(400).json({status:'error',message:'Invalid JSON'});}if(!ACTIONS.has(payload.action))return res.status(400).json({status:'error',message:'Unsupported action; bulk overwrite disabled'});}
 const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(req.method==='POST'&&!['readBook','recordBookVisit'].includes(payload.action)&&!await verifyAdminRequest(req))return res.status(401).json({status:'error',message:'Login Google Admin yang valid diperlukan.'});
 const upstreamBody=req.method==='GET'?{action:'catalog'}:{...payload};delete upstreamBody.secretKey;delete upstreamBody.adminSecret;delete upstreamBody.authToken;
 if(token)upstreamBody.authToken=token;
 const response=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8','Accept':'application/json'},body:JSON.stringify(upstreamBody),redirect:'follow',signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error('UPSTREAM_FAILED');const result=await response.json();
 if(!result||result.status!=='success')return res.status([400,401,403,404,409,413,429,503].includes(result?.code)?result.code:502).json({status:'error',message:result?.message||'Penyimpanan cloud gagal.',code:result?.code||'UPSTREAM_FAILED'});
 if(req.method==='GET')return res.status(200).json(publicCatalog(result));
 if(result.book){delete result.book.password;delete result.book.passwordHash;}
 return res.status(200).json(result);
 }catch{return res.status(502).json({status:'error',code:'CLOUD_UNAVAILABLE',message:'Database cloud tidak merespons. Data belum dinyatakan tersimpan; coba lagi dengan requestId yang sama.'});}
}

