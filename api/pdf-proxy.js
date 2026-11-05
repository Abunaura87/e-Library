function repairArabicEncoding(value){
 let text=String(value||'');const arab=s=>(s.match(/[\u0600-\u06ff]/g)||[]).length;
 if(!/[ØÙÚÛ]/.test(text))return text;
 const reverse=new Map();const decoder=new TextDecoder('windows-1252');
 for(let i=0;i<256;i++)reverse.set(decoder.decode(Uint8Array.of(i)),i);
 for(let pass=0;pass<2;pass++){try{
 const bytes=Array.from(text,c=>{const n=c.charCodeAt(0);if(n<=255)return n;if(reverse.has(c))return reverse.get(c);throw Error('Not reversible');});
 const fixed=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bytes));
 if(arab(fixed)<=arab(text))break;text=fixed;
 }catch{break;}}
 return text;
}
function pdfFilename(disposition){
 const extended=String(disposition).match(/filename\*\s*=\s*(?:"([^"]*)"|([^;]*))/i);
 if(extended){const value=(extended[1]||extended[2]||'').trim();const parts=value.match(/^UTF-8'[^']*'(.*)$/i);if(parts){try{return decodeURIComponent(parts[1]);}catch{}}}
 const basic=String(disposition).match(/filename\s*=\s*(?:"((?:\\.|[^"])*)"|([^;]*))/i);
 return basic?repairArabicEncoding((basic[1]||basic[2]||'').replace(/\\(["\\])/g,'$1').trim()):'';
}
import { Readable } from 'node:stream';

// A single PDF proxy shared by the development server and Vercel.
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Expose-Headers','X-PDF-Filename, Content-Disposition');
  if(req.method==='OPTIONS')return res.status(204).end();if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),50000);const disconnected=()=>{if(!res.writableEnded)controller.abort();};res.on('close',disconnected);
  let restricted=false;
  try{
    const raw=String(req.query&&req.query.url||'').trim();let parsed;try{parsed=new URL(raw);}catch{return res.status(400).json({error:'Tautan PDF tidak valid.'});}
    if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)return res.status(400).json({error:'Gunakan tautan PDF HTTP/HTTPS yang valid.'});
    const auth=String(req.headers&&req.headers.authorization||req.query&&req.query.token||'').replace(/^Bearer\s+/i,'').trim();
    const driveHost=['drive.google.com','docs.google.com','drive.usercontent.google.com'].includes(parsed.hostname);
    const match=parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);const id=driveHost&&(match&&match[1]||parsed.searchParams.get('id'));
    const candidates=[];
    if(id){if(auth)candidates.push({url:'https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media',headers:{Authorization:'Bearer '+auth}});candidates.push({url:'https://drive.usercontent.google.com/download?id='+encodeURIComponent(id)+'&export=download&confirm=t'});candidates.push({url:'https://drive.google.com/uc?export=download&confirm=t&id='+encodeURIComponent(id)});}
    else candidates.push({url:parsed.href});
    const fetchPdf=async candidate=>{const attempt=new AbortController();const abort=()=>attempt.abort();controller.signal.addEventListener('abort',abort,{once:true});const headerTimer=setTimeout(abort,14000);try{const response=await fetch(candidate.url,{headers:{Accept:'application/pdf,application/octet-stream,*/*',...candidate.headers},redirect:'follow',signal:attempt.signal});clearTimeout(headerTimer);return {response,release:()=>{controller.signal.removeEventListener('abort',abort);attempt.abort();}};}catch(error){controller.signal.removeEventListener('abort',abort);throw error;}finally{clearTimeout(headerTimer);}};
    for(let index=0;index<candidates.length;index++){
      if(controller.signal.aborted)break;let release=()=>{};
      try{
        const fetched=await fetchPdf(candidates[index]);release=fetched.release;const upstream=fetched.response;
        if(!upstream.ok||upstream.url.includes('accounts.google.com')){if([401,403].includes(upstream.status)||upstream.url.includes('accounts.google.com'))restricted=true;release();continue;}
        const reader=upstream.body&&upstream.body.getReader();if(!reader){release();continue;}
        const first=await reader.read();if(first.done){release();continue;}const head=Buffer.from(first.value).subarray(0,1024).toString('latin1');
        if(!head.includes('%PDF-')){
          let html=Buffer.from(first.value).toString('utf8');while(html.length<65536){const part=await reader.read();if(part.done)break;html+=Buffer.from(part.value).toString('utf8');}reader.cancel().catch(()=>{});release();
          if(html.includes('accounts.google.com')||html.includes('ServiceLogin'))restricted=true;
          if(id&&html.includes('download-form')){const confirm=new URL('https://drive.usercontent.google.com/download');confirm.searchParams.set('id',id);confirm.searchParams.set('export','download');confirm.searchParams.set('confirm','t');let count=0;for(const input of html.matchAll(/<input\b[^>]*>/gi)){const name=input[0].match(/\bname=["']([^"']+)["']/i),value=input[0].match(/\bvalue=["']([^"']*)["']/i);if(name&&value&&['confirm','uuid','at','resourcekey'].includes(name[1])&&value[1].length<2048){confirm.searchParams.set(name[1],value[1].replace(/&amp;/g,'&'));count++;}}if(count&&index<3)candidates.splice(index+1,0,{url:confirm.href});}
          continue;
        }
        const disposition=upstream.headers.get('content-disposition')||'';const filename=pdfFilename(disposition);if(filename)res.setHeader('X-PDF-Filename',encodeURIComponent(filename));
        res.setHeader('Content-Type','application/pdf');res.setHeader('Cache-Control',auth?'private, no-store':'public, max-age=3600');
        // Forward bytes as they arrive instead of buffering the entire PDF in server memory.
        const stream=Readable.from((async function*(){try{yield first.value;while(true){const next=await reader.read();if(next.done)break;yield next.value;}}finally{release();}})());
        await new Promise((resolve,reject)=>{stream.on('error',reject);res.on('finish',resolve);res.on('close',resolve);stream.pipe(res);});return;
      }catch(error){release();if(res.headersSent){res.destroy(error);return;}}
    }
    return res.status(controller.signal.aborted?504:restricted?403:422).json({error:controller.signal.aborted?'Unduhan PDF melewati batas waktu. Coba kembali atau unggah file PDF langsung.':restricted?'File Google Drive belum dapat diakses. Periksa izin file atau unggah PDF langsung.':'Tautan tidak mengembalikan PDF yang valid. Gunakan link file PDF atau unggah berkas lokal.'});
  }catch(error){if(!res.headersSent)res.status(502).json({error:error.message||'PDF belum dapat diunduh.'});else res.destroy(error);}
  finally{clearTimeout(timer);res.removeListener('close',disconnected);}
}
