const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('./qr_vendor/QRCode');
const QRErrorCorrectLevel = require('./qr_vendor/QRCode/QRErrorCorrectLevel');

const VERSION = '0.2.0';
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'offline-queue.json');
const MAX_FRAME_BYTES = 262144;
const MAX_QUEUE_PER_ID = Number(process.env.MAX_QUEUE_PER_ID || 500);
const QUEUE_TTL_MS = Number(process.env.QUEUE_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const HTTP_RATE_PER_MIN = Number(process.env.HTTP_RATE_PER_MIN || 120);
const WS_RATE_PER_MIN = Number(process.env.WS_RATE_PER_MIN || 180);
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

fs.mkdirSync(DATA_DIR, { recursive: true });
let offlineQueue = {};
try { offlineQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch { offlineQueue = {}; }

function atomicWriteJson(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}
function saveQueue() {
  try { atomicWriteJson(QUEUE_FILE, offlineQueue); }
  catch (err) { console.error('queue persistence error:', err.message); }
}
function pruneQueue() {
  const cutoff = Date.now() - QUEUE_TTL_MS;
  let changed = false;
  for (const id of Object.keys(offlineQueue)) {
    const kept = (Array.isArray(offlineQueue[id]) ? offlineQueue[id] : []).filter(env => Number(env?.payload?.sentAt || 0) >= cutoff).slice(-MAX_QUEUE_PER_ID);
    if (kept.length) offlineQueue[id] = kept;
    else delete offlineQueue[id];
    changed = true;
  }
  if (changed) saveQueue();
}
pruneQueue();
setInterval(pruneQueue, 60 * 60 * 1000).unref();

const mime = {
  '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml'
};
const rateBuckets = new Map();
function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.socket.remoteAddress || 'unknown';
}
function rateOK(key, limit) {
  const now = Date.now(), windowMs = 60_000;
  let b = rateBuckets.get(key);
  if (!b || now - b.start >= windowMs) b = { start: now, count: 0 };
  b.count += 1; rateBuckets.set(key, b);
  return b.count <= limit;
}
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [k,b] of rateBuckets) if (b.start < cutoff) rateBuckets.delete(k);
}, 120_000).unref();

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ws: wss:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('X-Frame-Options','DENY');
}
function qrSvg(text) {
  const qr = new QRCode(-1, QRErrorCorrectLevel.M);
  qr.addData(text); qr.make();
  const n = qr.getModuleCount(), margin = 4, size = n + margin * 2;
  let d = '';
  for (let r=0;r<n;r++) for(let c=0;c<n;c++) if(qr.isDark(r,c)) d += `M${c+margin} ${r+margin}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="${d}" fill="black"/></svg>`;
}

const server = http.createServer((req, res) => {
  securityHeaders(res);
  const ip = clientIp(req);
  if (!rateOK(`http:${ip}`, HTTP_RATE_PER_MIN)) {
    res.writeHead(429, {'content-type':'text/plain; charset=utf-8','retry-after':'60'}); return res.end('too many requests');
  }
  try {
    const host = req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url, `http://${host}`);
    if (url.pathname === '/health') {
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ ok:true, service:'FREE relay', version:VERSION, connected:clients.size, queued:Object.values(offlineQueue).reduce((n,x)=>n+(Array.isArray(x)?x.length:0),0) }));
    }
    if (url.pathname === '/api/qr') {
      const text = url.searchParams.get('text') || '';
      if (!text || text.length > 4000) { res.writeHead(400); return res.end('bad text'); }
      const svg = qrSvg(text);
      res.writeHead(200, {'content-type':'image/svg+xml', 'cache-control':'no-store'});
      return res.end(svg);
    }
    let reqPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.normalize(path.join(PUBLIC_DIR, reqPath));
    if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== path.join(PUBLIC_DIR,'index.html')) { res.writeHead(403); return res.end('forbidden'); }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      const ext = path.extname(filePath);
      const cache = ext === '.html' ? 'no-store' : 'public, max-age=3600';
      res.writeHead(200, {'content-type': mime[ext] || 'application/octet-stream', 'cache-control':cache});
      res.end(data);
    });
  } catch (e) {
    console.error('http error:', e.message);
    res.writeHead(500); res.end('server error');
  }
});

const clients = new Map();
function validId(id) { return typeof id === 'string' && /^[A-Fa-f0-9]{16,128}$/.test(id); }
function safeEnvelope(x) {
  if (!(x && x.type === 'envelope' && validId(x.to) && validId(x.from) && x.payload)) return false;
  const p = x.payload;
  return typeof p.ciphertext === 'string' && p.ciphertext.length <= 350000 &&
    typeof p.iv === 'string' && p.iv.length <= 128 && typeof p.signature === 'string' && p.signature.length <= 512 &&
    typeof p.sentAt === 'number' && Math.abs(Date.now() - p.sentAt) <= 30 * 24 * 60 * 60 * 1000 &&
    typeof p.msgId === 'string' && p.msgId.length >= 8 && p.msgId.length <= 128;
}
function wsSend(socket, obj) {
  if (!socket || socket.destroyed) return;
  const data = Buffer.from(JSON.stringify(obj));
  let header;
  if (data.length < 126) { header = Buffer.from([0x81, data.length]); }
  else if (data.length < 65536) { header = Buffer.alloc(4); header[0]=0x81; header[1]=126; header.writeUInt16BE(data.length,2); }
  else { header = Buffer.alloc(10); header[0]=0x81; header[1]=127; header.writeBigUInt64BE(BigInt(data.length),2); }
  socket.write(Buffer.concat([header,data]));
}
function parseFrames(buffer) {
  const frames=[]; let offset=0;
  while (offset+2<=buffer.length) {
    const b1=buffer[offset], b2=buffer[offset+1], opcode=b1&0x0f, masked=!!(b2&0x80); let len=b2&0x7f, h=2;
    if (!masked) throw new Error('client frames must be masked');
    if (len===126) { if(offset+4>buffer.length) break; len=buffer.readUInt16BE(offset+2); h=4; }
    else if (len===127) { if(offset+10>buffer.length) break; const big=buffer.readBigUInt64BE(offset+2); if(big>BigInt(MAX_FRAME_BYTES)) throw new Error('too large'); len=Number(big); h=10; }
    if (len > MAX_FRAME_BYTES) throw new Error('too large');
    const maskLen=4; if(offset+h+maskLen+len>buffer.length) break;
    const mask=buffer.subarray(offset+h,offset+h+4); const payload=Buffer.from(buffer.subarray(offset+h+maskLen,offset+h+maskLen+len));
    for(let i=0;i<payload.length;i++) payload[i]^=mask[i%4];
    frames.push({opcode,payload}); offset += h+maskLen+len;
  }
  return {frames, rest:buffer.subarray(offset)};
}
function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (ALLOWED_ORIGINS.length) return ALLOWED_ORIGINS.includes(origin);
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

server.on('upgrade', (req, socket) => {
  const ip = clientIp(req);
  try {
    const host = req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url, `http://${host}`);
    if (url.pathname !== '/ws' || !req.headers['sec-websocket-key'] || !originAllowed(req) || !rateOK(`upgrade:${ip}`, 30)) return socket.destroy();
    const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
    let id=null, buf=Buffer.alloc(0);
    socket.on('data', chunk => {
      try {
        if (!rateOK(`ws:${ip}`, WS_RATE_PER_MIN)) throw new Error('ws rate limit');
        buf=Buffer.concat([buf,chunk]); if (buf.length > MAX_FRAME_BYTES * 2) throw new Error('buffer too large');
        const parsed=parseFrames(buf); buf=parsed.rest;
        for(const f of parsed.frames){
          if(f.opcode===0x8){ socket.end(); return; }
          if(f.opcode===0x9){ socket.write(Buffer.from([0x8A,0x00])); continue; }
          if(f.opcode!==0x1 || f.payload.length>MAX_FRAME_BYTES) continue;
          let msg; try{msg=JSON.parse(f.payload.toString('utf8'));}catch{continue}
          if(msg.type==='hello' && validId(msg.id)){
            id=msg.id.toLowerCase();
            const prior=clients.get(id); if(prior && prior!==socket && !prior.destroyed) prior.destroy();
            clients.set(id,socket); wsSend(socket,{type:'hello-ok',id,serverTime:Date.now(),version:VERSION});
            const queued=offlineQueue[id]||[]; delete offlineQueue[id]; saveQueue(); for(const env of queued) wsSend(socket,env); continue;
          }
          if(safeEnvelope(msg) && id && msg.from.toLowerCase()===id){
            const to=msg.to.toLowerCase(), target=clients.get(to); let queued=true;
            if(target && !target.destroyed){ wsSend(target,msg); queued=false; }
            else {
              offlineQueue[to]=offlineQueue[to]||[];
              if (!offlineQueue[to].some(x => x?.payload?.msgId === msg.payload.msgId)) offlineQueue[to].push(msg);
              if(offlineQueue[to].length>MAX_QUEUE_PER_ID) offlineQueue[to]=offlineQueue[to].slice(-MAX_QUEUE_PER_ID);
              saveQueue();
            }
            wsSend(socket,{type:'ack',msgId:msg.payload.msgId,queued});
          }
        }
      } catch (err) { console.warn('ws closed:', err.message); socket.destroy(); }
    });
    const cleanup=()=>{ if(id && clients.get(id)===socket) clients.delete(id); };
    socket.on('close',cleanup); socket.on('error',cleanup);
  } catch { socket.destroy(); }
});

server.listen(PORT, '0.0.0.0', () => console.log(`FREE v${VERSION} running on port ${PORT}`));
