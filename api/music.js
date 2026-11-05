import {verifyAdminRequest} from './gas.js';
export const config={maxDuration:300};
const MAX_RANGE=196608;
function gasUrl(){const url=process.env.GAS_WEB_APP_URL||process.env.SCRIPT_API_URL||'';if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))throw Error('CLOUD_NOT_CONFIGURED');return url;}
async function upstream(body){const r=await fetch(gasUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow',signal:AbortSignal.timeout(body.action==='saveMusic'?240000:50000)});if(!r.ok)throw Error('CLOUD_UNAVAILABLE');const result=await r.json();if(result.status!=='success'){const e=Error(result.message||'Musik belum tersimpan di server.');e.status=[400,401,403,404,409,413,416,429,503].includes(result.code)?result.code:502;throw e;}return result;}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
 const url=new URL(req.url,'https://library.invalid');const assetId=url.searchParams.get('asset');
 if(['GET','HEAD'].includes(req.method)&&assetId){
  if(!/^[A-Za-z0-9_-]{43}$/.test(assetId))return res.status(400).end();
  const range=String(req.headers.range||''),match=range.match(/^bytes=(\d+)-(\d*)$/);if(range&&!match)return res.status(416).end();const start=match?Number(match[1]):0,requestedEnd=match&&match[2]?Number(match[2]):start+MAX_RANGE-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(requestedEnd)||requestedEnd<start)return res.status(416).end();
  const part=await upstream({action:'musicAsset',assetId,start,length:Math.min(MAX_RANGE,requestedEnd-start+1)}),data=Buffer.from(part.data,'base64');if(data.length!==part.end-part.start+1)throw Error('INVALID_AUDIO_RESPONSE');
  res.setHeader('Content-Type',part.mimeType);res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Range',`bytes ${part.start}-${part.end}/${part.totalBytes}`);res.setHeader('Content-Length',String(data.length));res.setHeader('Cache-Control','public, max-age=31536000, immutable');return req.method==='HEAD'?res.status(206).end():res.status(206).send(data);
 }
 if(req.method==='GET')return res.status(200).json(await upstream({action:'musicSettings'}));
 if(req.method!=='POST')return res.status(405).json({status:'error',message:'Method not allowed'});
 if(!await verifyAdminRequest(req))return res.status(401).json({status:'error',message:'Login Admin diperlukan untuk mengganti musik.'});
 let payload;try{payload=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return res.status(400).json({status:'error',message:'Invalid JSON'});}
 if(!payload||payload.action!=='saveMusic')return res.status(400).json({status:'error',message:'Unsupported music action'});
 const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');return res.status(200).json(await upstream({...payload,authToken:token}));
 }catch(e){return res.status(e.status||502).json({status:'error',message:e.status?e.message:'Layanan musik belum merespons. Pilihan tetap tersedia. Klik Simpan kembali untuk memeriksa atau melanjutkan permintaan yang sama.'});}
}

