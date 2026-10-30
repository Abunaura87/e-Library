// Vercel Serverless Function for /api/pdf-proxy
// Ensures Google Drive PDF links and external PDF URLs stream with CORS & %PDF- validation on Vercel deployments

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'X-PDF-Filename, Content-Disposition');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawUrl = String((req.query && req.query.url) || '').trim();
    const authToken = String((req.query && req.query.token) || (req.headers && req.headers.authorization) || '')
      .replace(/^Bearer\s+/i, '')
      .trim();

    if (!rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
      return res.status(400).json({ error: 'Invalid PDF URL' });
    }

    const filePathMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
    const queryIdMatch = rawUrl.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    const driveId = (filePathMatch && filePathMatch[1]) || (queryIdMatch && queryIdMatch[1]) || '';
    const isDrive = Boolean(
      driveId &&
        (rawUrl.includes('drive.google.com') ||
          rawUrl.includes('docs.google.com') ||
          rawUrl.includes('drive.usercontent.google.com'))
    );

    const candidates = [];
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

    const hasPdfMagicBytes = (buf) => {
      if (!buf || buf.length < 5) return false;
      const head = buf.subarray(0, Math.min(buf.length, 1024)).toString('latin1');
      return head.includes('%PDF-');
    };

    const extractFilename = (disp) => {
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
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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
          return res.status(200).send(buf);
        }

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
                return res.status(200).send(retryBuf);
              }
            }
          }
        }
      } catch (innerErr) {
        // Continue to next candidate
      }
    }

    if (isRestricted) {
      return res.status(403).json({
        code: 'DRIVE_RESTRICTED',
        error:
          'Akses file Google Drive masih "Dibatasi" (Restricted). Buka Google Drive -> Klik Bagikan (Share) -> Ubah Akses Umum menjadi "Siapa saja yang memiliki link" (Anyone with the link).'
      });
    }

    return res.status(lastStatus >= 400 ? lastStatus : 422).json({
      code: 'INVALID_PDF',
      error: 'Tautan tidak mengembalikan berkas PDF yang valid. Pastikan link mengarah langsung ke file PDF publik.'
    });
  } catch (err) {
    return res.status(500).json({ error: (err && err.message) || 'Failed to proxy PDF' });
  }
}
