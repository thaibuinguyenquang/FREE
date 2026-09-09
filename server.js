const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { WebSocketServer, WebSocket } = require('ws');
const pqModule = import('@noble/post-quantum/ml-dsa.js');

const VERSION = 'FREE-009';
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'offline-queue.json');
const MAX_FRAME_BYTES = Number(process.env.MAX_FRAME_BYTES || 1024 * 1024);
const MAX_QUEUE_PER_ID = Number(process.env.MAX_QUEUE_PER_ID || 500);
const QUEUE_TTL_MS = Number(process.env.QUEUE_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const HTTP_RATE_PER_MIN = Number(process.env.HTTP_RATE_PER_MIN || 120);
const WS_RATE_PER_MIN = Number(process.env.WS_RATE_PER_MIN || 240);
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const PUBLIC_NODE_URL = String(process.env.PUBLIC_NODE_URL || '').trim().replace(/\/$/, '');
const BOOTSTRAP_PEERS = String(process.env.BOOTSTRAP_PEERS || '').split(',').map(s => s.trim()).filter(Boolean);
const MAX_FEDERATION_PEERS = Number(process.env.MAX_FEDERATION_PEERS || 32);

fs.mkdirSync(DATA_DIR, { recursive: true });
let offlineQueue = {};
try { offlineQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch { offlineQueue = {}; }

function atomicWriteJson(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}
function saveQueue() { try { atomicWriteJson(QUEUE_FILE, offlineQueue); } catch (err) { console.error('queue persistence error:', err.message); } }
function pruneQueue() {
  const cutoff = Date.now() - QUEUE_TTL_MS;
  let changed = false;
  for (const id of Object.keys(offlineQueue)) {
    const kept = (Array.isArray(offlineQueue[id]) ? offlineQueue[id] : []).filter(m => Number(m?.serverQueuedAt || m?.payload?.sentAt || m?.sentAt || 0) >= cutoff).slice(-MAX_QUEUE_PER_ID);
    if (kept.length) offlineQueue[id] = kept; else delete offlineQueue[id];
    changed = true;
  }
  if (changed) saveQueue();
}
pruneQueue();
setInterval(pruneQueue, 60 * 60 * 1000).unref();

const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const rateBuckets = new Map();
function clientIp(req) { return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown'; }
function rateOK(key, limit) {
  const now = Date.now(); let b = rateBuckets.get(key);
  if (!b || now - b.start >= 60000) b = {start:now,count:0};
  b.count++; rateBuckets.set(key,b); return b.count <= limit;
}
setInterval(()=>{const c=Date.now()-120000; for(const [k,b] of rateBuckets) if(b.start<c) rateBuckets.delete(k)},120000).unref();
function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('X-Frame-Options','DENY');
}

const clients = new Map();
const contactCards = new Map(); // public PQ identity cards only; never private keys
const storageNodes = new Set();
// FREE-008 testnet contribution accounting. Credits have NO monetary value.
// Account identity, node identity and future payment identity are separate namespaces.
const nodeServices = new Map();
const SERVICE_CREDIT_PER_MIB = Number(process.env.SERVICE_CREDIT_PER_MIB || 1);

// FREE-009 deterministic testnet economic policy.
// This is an accounting simulator, NOT a transferable or monetary token.
// Founder reward is a transparent share of NEW epoch emission only; it never debits users.
const ECON_POLICY = Object.freeze({
  id: 'FREE-ECON-1',
  version: 1,
  epochSeconds: Math.max(60, Number(process.env.ECON_EPOCH_SECONDS || 86400)),
  annualInflationRate: Math.max(0, Math.min(1, Number(process.env.ECON_ANNUAL_INFLATION || 0.05))),
  founderShare: Math.max(0, Math.min(1, Number(process.env.ECON_FOUNDER_SHARE || 0.10))),
  nodeShare: Math.max(0, Math.min(1, Number(process.env.ECON_NODE_SHARE || 0.65))),
  ecosystemShare: Math.max(0, Math.min(1, Number(process.env.ECON_ECOSYSTEM_SHARE || 0.15))),
  treasuryShare: Math.max(0, Math.min(1, Number(process.env.ECON_TREASURY_SHARE || 0.10))),
  genesisSupply: Math.max(0, Number(process.env.ECON_GENESIS_SUPPLY || 1000000000)),
  activationDelaySeconds: Math.max(0, Number(process.env.ECON_POLICY_TIMELOCK_SECONDS || 172800))
});
function assertEconomicPolicy(){
  const total=ECON_POLICY.founderShare+ECON_POLICY.nodeShare+ECON_POLICY.ecosystemShare+ECON_POLICY.treasuryShare;
  if(Math.abs(total-1)>1e-9) throw new Error(`economic allocation must equal 1.0; got ${total}`);
}
assertEconomicPolicy();
const ECON_STATE_FILE=path.join(DATA_DIR,'economy-state.json');
let econState;
try { econState=JSON.parse(fs.readFileSync(ECON_STATE_FILE,'utf8')); } catch {
  econState={policyId:ECON_POLICY.id,epoch:0,lastEpochAt:Date.now(),supply:ECON_POLICY.genesisSupply,founderAccrued:0,nodePoolAccrued:0,ecosystemAccrued:0,treasuryAccrued:0,totalEmission:0};
}
function saveEconomy(){ try{atomicWriteJson(ECON_STATE_FILE,econState)}catch(err){console.error('economy persistence error:',err.message)} }
function emissionForPeriod(supply,seconds){ return supply*ECON_POLICY.annualInflationRate*(seconds/(365.2425*24*60*60)); }
function settleEconomicEpochs(){
  const now=Date.now(), epochMs=ECON_POLICY.epochSeconds*1000;
  let guard=0;
  while(now-econState.lastEpochAt>=epochMs && guard++<10000){
    const emission=emissionForPeriod(econState.supply,ECON_POLICY.epochSeconds);
    econState.supply+=emission; econState.totalEmission+=emission; econState.epoch++;
    econState.founderAccrued+=emission*ECON_POLICY.founderShare;
    econState.nodePoolAccrued+=emission*ECON_POLICY.nodeShare;
    econState.ecosystemAccrued+=emission*ECON_POLICY.ecosystemShare;
    econState.treasuryAccrued+=emission*ECON_POLICY.treasuryShare;
    econState.lastEpochAt+=epochMs;
  }
  if(guard>1) saveEconomy();
}
function publicEconomy(){
  settleEconomicEpochs();
  return {mode:'testnet-accounting',monetaryValue:false,transferable:false,policy:ECON_POLICY,epoch:econState.epoch,nextEpochAt:econState.lastEpochAt+ECON_POLICY.epochSeconds*1000,supply:Number(econState.supply.toFixed(6)),totalEmission:Number(econState.totalEmission.toFixed(6)),allocations:{founder:Number(econState.founderAccrued.toFixed(6)),nodes:Number(econState.nodePoolAccrued.toFixed(6)),ecosystem:Number(econState.ecosystemAccrued.toFixed(6)),treasury:Number(econState.treasuryAccrued.toFixed(6))}};
}
setInterval(()=>{settleEconomicEpochs();saveEconomy()},Math.min(60000,ECON_POLICY.epochSeconds*1000)).unref();
function validNodeId(x){ return typeof x==='string' && /^[a-f0-9]{32,128}$/i.test(x); }
function serviceFor(nodeId, ownerId){ let x=nodeServices.get(nodeId); if(!x){x={nodeId,ownerId,capacityMb:0,storedBytes:0,receipts:0,credits:0,lastSeen:Date.now(),rewardedCids:new Set()};nodeServices.set(nodeId,x)} return x; }
function publicService(x){return {nodeId:x.nodeId,capacityMb:x.capacityMb,storedBytes:x.storedBytes,receipts:x.receipts,credits:Number(x.credits.toFixed(6)),lastSeen:x.lastSeen};}


// FREE-007 federation foundation. Nodes are untrusted transports: user payloads remain
// end-to-end signed/encrypted. Federation improves availability but does not yet provide
// metadata anonymity; that is a later protocol layer.
const NODE_ID_FILE = path.join(DATA_DIR, 'node-identity.json');
let nodeIdentity;
try { nodeIdentity = JSON.parse(fs.readFileSync(NODE_ID_FILE, 'utf8')); } catch {
  nodeIdentity = { nodeId: crypto.randomBytes(20).toString('hex'), createdAt: Date.now() };
  try { atomicWriteJson(NODE_ID_FILE, nodeIdentity); } catch {}
}
const NODE_ID = nodeIdentity.nodeId;
const peerSockets = new Map();          // nodeId -> ws
const peerUrls = new Map();             // nodeId -> public base URL
const knownPeerUrls = new Set();
const remoteRoutes = new Map();         // userId -> Set(nodeId)
const seenFederatedRoutes = new Map();  // routeId -> timestamp
const pendingCardLookups = new Map();   // requestId -> resolver
const federationWss = new WebSocketServer({ noServer: true, maxPayload: MAX_FRAME_BYTES });

function federationUrl(input) {
  if (!input) return '';
  try {
    const u = new URL(input);
    if (u.protocol === 'http:') u.protocol = 'ws:';
    if (u.protocol === 'https:') u.protocol = 'wss:';
    if (u.protocol !== 'ws:' && u.protocol !== 'wss:') return '';
    if (!u.pathname || u.pathname === '/') u.pathname = '/federation';
    return u.toString();
  } catch { return ''; }
}
function publicFederationUrl() { return federationUrl(PUBLIC_NODE_URL); }
function cleanSeenRoutes() {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [k,t] of seenFederatedRoutes) if (t < cutoff) seenFederatedRoutes.delete(k);
}
setInterval(cleanSeenRoutes, 60 * 1000).unref();
function peerSend(ws, obj) { try { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); } catch {} }
function broadcastPeers(obj, exceptNodeId='') { for (const [nid,ws] of peerSockets) if (nid !== exceptNodeId) peerSend(ws,obj); }
function addRemoteRoute(userId,nodeId) {
  if (!validId(userId) || !nodeId) return;
  const set = remoteRoutes.get(userId) || new Set(); set.add(nodeId); remoteRoutes.set(userId,set);
}
function removeRemoteRoute(userId,nodeId) {
  const set=remoteRoutes.get(userId); if(!set)return; set.delete(nodeId); if(!set.size)remoteRoutes.delete(userId);
}
function announcePresence(userId, online) { broadcastPeers({type:'presence',nodeId:NODE_ID,userId,online}); }
function connectedPeerSummary() { return [...peerSockets.keys()]; }
function routeFederated(to,msg) {
  const candidates=[...(remoteRoutes.get(to.toLowerCase())||[])].filter(id=>peerSockets.has(id));
  const routeId=crypto.randomBytes(16).toString('hex');
  const packet={type:'federated-route',routeId,ttl:6,to:to.toLowerCase(),msg};
  if(candidates.length){ peerSend(peerSockets.get(candidates[0]),packet); return true; }
  if(peerSockets.size){ seenFederatedRoutes.set(routeId,Date.now()); broadcastPeers(packet); return true; }
  return false;
}
async function lookupRemoteCard(id, timeoutMs=1800) {
  if(!peerSockets.size) return null;
  const requestId=crypto.randomBytes(16).toString('hex');
  return await new Promise(resolve=>{
    const timer=setTimeout(()=>{pendingCardLookups.delete(requestId);resolve(null)},timeoutMs);
    pendingCardLookups.set(requestId,card=>{clearTimeout(timer);pendingCardLookups.delete(requestId);resolve(card||null)});
    broadcastPeers({type:'card-request',requestId,id,ttl:5,origin:NODE_ID});
  });
}
function registerPeer(ws, hello, outboundUrl='') {
  const nodeId=String(hello?.nodeId||''); if(!/^[a-f0-9]{16,128}$/i.test(nodeId)||nodeId===NODE_ID){try{ws.close()}catch{};return false}
  const old=peerSockets.get(nodeId); if(old&&old!==ws){try{old.close()}catch{}}
  peerSockets.set(nodeId,ws); ws.freeNodeId=nodeId;
  const advertised=String(hello?.publicUrl||''); if(advertised){peerUrls.set(nodeId,advertised);knownPeerUrls.add(advertised)}
  if(outboundUrl) knownPeerUrls.add(outboundUrl);
  for(const uid of Array.isArray(hello?.users)?hello.users:[]) addRemoteRoute(uid,nodeId);
  peerSend(ws,{type:'node-hello',nodeId:NODE_ID,version:VERSION,publicUrl:PUBLIC_NODE_URL,users:[...clients.keys()]});
  peerSend(ws,{type:'peer-list',peers:[PUBLIC_NODE_URL,...peerUrls.values()].filter(Boolean)});
  return true;
}
function handlePeerMessage(ws, raw) {
  let msg; try { msg=JSON.parse(String(raw)); } catch { return; }
  if(msg.type==='node-hello'){ registerPeer(ws,msg,ws.freeOutboundUrl||''); return; }
  const peerId=ws.freeNodeId; if(!peerId)return;
  if(msg.type==='presence'&&msg.nodeId===peerId&&validId(msg.userId)){msg.online?addRemoteRoute(msg.userId,peerId):removeRemoteRoute(msg.userId,peerId);return}
  if(msg.type==='peer-list'&&Array.isArray(msg.peers)){for(const u of msg.peers.slice(0,64)){if(typeof u==='string'&&u&&u!==PUBLIC_NODE_URL)knownPeerUrls.add(u)};schedulePeerConnections();return}
  if(msg.type==='federated-route'&&typeof msg.routeId==='string'&&validId(msg.to)&&msg.msg){
    if(seenFederatedRoutes.has(msg.routeId))return; seenFederatedRoutes.set(msg.routeId,Date.now());
    const local=clients.get(msg.to.toLowerCase()); if(local&&!local.destroyed){wsSend(local,msg.msg);return}
    if(Number(msg.ttl)>0) broadcastPeers({...msg,ttl:Number(msg.ttl)-1},peerId); return;
  }
  if(msg.type==='card-request'&&typeof msg.requestId==='string'&&validId(msg.id)){
    const card=contactCards.get(msg.id.toLowerCase()); if(card){peerSend(ws,{type:'card-response',requestId:msg.requestId,card});return}
    if(Number(msg.ttl)>0) broadcastPeers({...msg,ttl:Number(msg.ttl)-1},peerId); return;
  }
  if(msg.type==='card-response'&&typeof msg.requestId==='string'&&msg.card){
    const c=msg.card; if(c&&validId(c.id)&&pqIdentityId(c)===c.id.toLowerCase()){const done=pendingCardLookups.get(msg.requestId);if(done)done(c); else broadcastPeers(msg,peerId)} return;
  }
}
function attachPeerSocket(ws, outboundUrl='') {
  ws.freeOutboundUrl=outboundUrl;
  ws.on('message',data=>handlePeerMessage(ws,data));
  ws.on('close',()=>{const nid=ws.freeNodeId;if(nid&&peerSockets.get(nid)===ws)peerSockets.delete(nid);if(nid){for(const [uid,set] of remoteRoutes){set.delete(nid);if(!set.size)remoteRoutes.delete(uid)}}});
  ws.on('error',()=>{});
  if(outboundUrl) peerSend(ws,{type:'node-hello',nodeId:NODE_ID,version:VERSION,publicUrl:PUBLIC_NODE_URL,users:[...clients.keys()]});
}
function connectPeer(baseUrl) {
  if(peerSockets.size>=MAX_FEDERATION_PEERS)return;
  const u=federationUrl(baseUrl); if(!u||u===publicFederationUrl())return;
  if([...peerSockets.values()].some(x=>x.freeOutboundUrl===baseUrl||x.freeOutboundUrl===u))return;
  try{
    const ws=new WebSocket(u,{handshakeTimeout:8000,maxPayload:MAX_FRAME_BYTES});
    ws.freeOutboundUrl=baseUrl;
    ws.on('open',()=>attachPeerSocket(ws,baseUrl));
    ws.on('error',()=>{});
  }catch{}
}
let peerConnectTimer=null;
function schedulePeerConnections(){if(peerConnectTimer)return;peerConnectTimer=setTimeout(()=>{peerConnectTimer=null;for(const u of knownPeerUrls)connectPeer(u)},300);peerConnectTimer.unref?.()}
for(const u of BOOTSTRAP_PEERS) knownPeerUrls.add(u);
setInterval(()=>{for(const u of knownPeerUrls)connectPeer(u)},15000).unref();
function validId(id){ return typeof id === 'string' && /^[a-f0-9]{16,128}$/i.test(id); }
function validCid(cid){ return typeof cid === 'string' && /^[a-f0-9]{64}$/i.test(cid); }
function pqIdentityId(card){return crypto.createHash('sha512').update(`FREE-PQ1:${card.kemPublicKey}:${card.sigPublicKey}`,'utf8').digest('hex').slice(0,64)}
function fromB64(s){return new Uint8Array(Buffer.from(s,'base64'))}
async function verifyPqSignatureBytes(signature,messageBytes,publicKey){try{const {ml_dsa65}=await pqModule;return ml_dsa65.verify(fromB64(signature),messageBytes,fromB64(publicKey))}catch(err){console.warn('PQ verify error:',err?.message||err);return false}}
async function verifyPqSignature(signature,message,publicKey){return verifyPqSignatureBytes(signature,Buffer.from(JSON.stringify(message),'utf8'),publicKey)}
function queueFor(to, msg){
  to = to.toLowerCase();
  offlineQueue[to] = offlineQueue[to] || [];
  const key = msg?.payload?.msgId || msg?.msgId || msg?.requestId || `${msg.type}:${Date.now()}:${Math.random()}`;
  if (!offlineQueue[to].some(x => (x?.payload?.msgId || x?.msgId || x?.requestId) === key)) offlineQueue[to].push({...msg,serverQueuedAt:Date.now()});
  if (offlineQueue[to].length > MAX_QUEUE_PER_ID) offlineQueue[to] = offlineQueue[to].slice(-MAX_QUEUE_PER_ID);
  saveQueue();
}
function route(to,msg,{queue=true}={}){
  if(!validId(to)) return false;
  const target=clients.get(to.toLowerCase());
  if(target && !target.destroyed){ wsSend(target,msg); return true; }
  if(routeFederated(to,msg)) return true;
  if(queue) queueFor(to,msg);
  return false;
}
function safeEnvelope(x){
  if(!(x && x.type==='envelope' && validId(x.to) && validId(x.from) && x.payload)) return false;
  const p=x.payload;
  return p.suite==='FREE-PQ1' && typeof p.kemCiphertext==='string' && p.kemCiphertext.length<=8000 && typeof p.ciphertext==='string' && p.ciphertext.length<=700000 && typeof p.iv==='string' && p.iv.length<=128 && typeof p.signature==='string' && p.signature.length<=12000 && typeof p.sentAt==='number' && Math.abs(Date.now()-p.sentAt)<=30*24*60*60*1000 && typeof p.msgId==='string' && p.msgId.length>=8 && p.msgId.length<=128;
}
function safeContactCard(x){
  const c=x?.card;
  return x && x.type==='contact-card' && validId(x.to) && validId(x.from) && c && c.v===2 && c.cryptoSuite==='FREE-PQ1' && c.id===x.from && typeof c.kemPublicKey==='string' && c.kemPublicKey.length<4000 && typeof c.sigPublicKey==='string' && c.sigPublicKey.length<5000 && typeof x.signature==='string' && x.signature.length<12000;
}
function safePublishCard(x){
  const c=x?.card;
  return x && x.type==='publish-card' && validId(x.from) && c && c.v===2 && c.cryptoSuite==='FREE-PQ1' && c.id===x.from && typeof c.kemPublicKey==='string' && c.kemPublicKey.length<4000 && typeof c.sigPublicKey==='string' && c.sigPublicKey.length<5000;
}
function safeHelloAuth(x){
  const c=x?.card;
  return x && x.type==='hello-auth' && typeof x.challenge==='string' && x.challenge.length<256 && validId(x.id) && c && c.id===x.id && c.v===2 && c.cryptoSuite==='FREE-PQ1' && c.kem==='ML-KEM-768' && c.signature==='ML-DSA-65' && typeof c.kemPublicKey==='string' && c.kemPublicKey.length<4000 && typeof c.sigPublicKey==='string' && c.sigPublicKey.length<5000 && typeof x.signature==='string' && x.signature.length<12000;
}
function safeVaultStore(x){ return x && x.type==='vault-store' && validId(x.to) && validId(x.from) && validCid(x.cid) && typeof x.vaultId==='string' && x.vaultId.length<=128 && typeof x.share==='string' && x.share.length<=700000; }
function safeVaultFetch(x){ return x && x.type==='vault-fetch' && validId(x.to) && validId(x.from) && validCid(x.cid) && typeof x.requestId==='string' && x.requestId.length<=128; }
function safeVaultResponse(x){ return x && x.type==='vault-response' && validId(x.to) && validId(x.from) && validCid(x.cid) && typeof x.requestId==='string' && typeof x.share==='string' && x.share.length<=700000; }

const server = http.createServer(async (req,res)=>{
  securityHeaders(res);
  const ip=clientIp(req);
  if(!rateOK(`http:${ip}`,HTTP_RATE_PER_MIN)){res.writeHead(429,{'content-type':'text/plain','retry-after':'60'});return res.end('too many requests')}
  try{
    const host=req.headers.host||`localhost:${PORT}`; const url=new URL(req.url,`http://${host}`);
    if(url.pathname==='/health'){
      res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:true,service:'FREE relay',version:VERSION,connected:clients.size,storageNodes:storageNodes.size,nodeId:NODE_ID,federationPeers:peerSockets.size,knownPeers:knownPeerUrls.size,queued:Object.values(offlineQueue).reduce((n,x)=>n+(Array.isArray(x)?x.length:0),0),economy:'testnet-inflation-accounting',economicPolicy:ECON_POLICY.id,economicEpoch:econState.epoch,contributingNodes:nodeServices.size}));
    }
    if(url.pathname==='/api/card'){
      const id=(url.searchParams.get('id')||'').toLowerCase();
      if(!validId(id)){res.writeHead(400,{'content-type':'application/json'});return res.end(JSON.stringify({error:'bad id'}))}
      let card=contactCards.get(id);
      if(!card) card=await lookupRemoteCard(id);
      if(!card){res.writeHead(404,{'content-type':'application/json','cache-control':'no-store'});return res.end(JSON.stringify({error:'identity not found on connected FREE nodes'}))}
      res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});return res.end(JSON.stringify(card));
    }
    if(url.pathname==='/api/network'){
      const services=[...nodeServices.values()].map(publicService);
      res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({version:VERSION,economy:publicEconomy(),serviceAccounting:{name:'FREE Test Credits',monetaryValue:false,storageNodes:storageNodes.size,contributingNodes:services.length,totalStoredBytes:services.reduce((n,x)=>n+x.storedBytes,0),totalCredits:Number(services.reduce((n,x)=>n+x.credits,0).toFixed(6))}}));
    }
    if(url.pathname==='/api/qr'){
      const text=url.searchParams.get('text')||''; if(!text||text.length>4000){res.writeHead(400);return res.end('bad text')}
      const svg=await QRCode.toString(text,{type:'svg',errorCorrectionLevel:'M',margin:2});
      res.writeHead(200,{'content-type':'image/svg+xml','cache-control':'no-store'}); return res.end(svg);
    }
    let reqPath=url.pathname==='/'?'/index.html':url.pathname; const filePath=path.normalize(path.join(PUBLIC_DIR,reqPath));
    if(!filePath.startsWith(PUBLIC_DIR+path.sep) && filePath!==path.join(PUBLIC_DIR,'index.html')){res.writeHead(403);return res.end('forbidden')}
    fs.readFile(filePath,(err,data)=>{if(err){res.writeHead(404);return res.end('not found')} const ext=path.extname(filePath); res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':ext==='.html'?'no-store':'public, max-age=3600'});res.end(data)});
  }catch(e){console.error('http error:',e.message);res.writeHead(500);res.end('server error')}
});

function wsSend(socket,obj){
  if(!socket||socket.destroyed)return; const data=Buffer.from(JSON.stringify(obj)); let header;
  if(data.length<126)header=Buffer.from([0x81,data.length]);
  else if(data.length<65536){header=Buffer.alloc(4);header[0]=0x81;header[1]=126;header.writeUInt16BE(data.length,2)}
  else{header=Buffer.alloc(10);header[0]=0x81;header[1]=127;header.writeBigUInt64BE(BigInt(data.length),2)}
  socket.write(Buffer.concat([header,data]));
}
function parseFrames(buffer){
  const frames=[];let offset=0;
  while(offset+2<=buffer.length){const b1=buffer[offset],b2=buffer[offset+1],opcode=b1&15,masked=!!(b2&128);let len=b2&127,h=2;if(!masked)throw new Error('client frames must be masked');if(len===126){if(offset+4>buffer.length)break;len=buffer.readUInt16BE(offset+2);h=4}else if(len===127){if(offset+10>buffer.length)break;const big=buffer.readBigUInt64BE(offset+2);if(big>BigInt(MAX_FRAME_BYTES))throw new Error('too large');len=Number(big);h=10}if(len>MAX_FRAME_BYTES)throw new Error('too large');if(offset+h+4+len>buffer.length)break;const mask=buffer.subarray(offset+h,offset+h+4),payload=Buffer.from(buffer.subarray(offset+h+4,offset+h+4+len));for(let i=0;i<payload.length;i++)payload[i]^=mask[i%4];frames.push({opcode,payload});offset+=h+4+len}return{frames,rest:buffer.subarray(offset)};
}
function originAllowed(req){const origin=req.headers.origin;if(!origin)return true;if(ALLOWED_ORIGINS.length)return ALLOWED_ORIGINS.includes(origin);try{return new URL(origin).host===req.headers.host}catch{return false}}

server.on('upgrade',(req,socket)=>{
  const ip=clientIp(req);
  try{
    const host=req.headers.host||`localhost:${PORT}`,url=new URL(req.url,`http://${host}`);
    if(url.pathname==='/federation'){
      if(!req.headers['sec-websocket-key']||!rateOK(`federation-upgrade:${ip}`,60))return socket.destroy();
      return federationWss.handleUpgrade(req,socket,Buffer.alloc(0),ws=>{attachPeerSocket(ws);peerSend(ws,{type:'node-hello',nodeId:NODE_ID,version:VERSION,publicUrl:PUBLIC_NODE_URL,users:[...clients.keys()]})});
    }
    if(url.pathname!=='/ws'||!req.headers['sec-websocket-key']||!originAllowed(req)||!rateOK(`upgrade:${ip}`,30))return socket.destroy();
    const accept=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
    const challenge=crypto.randomBytes(32).toString('base64url');
    wsSend(socket,{type:'challenge',challenge,version:VERSION});
    let id=null,buf=Buffer.alloc(0);
    socket.on('data',async chunk=>{
      try{
        if(!rateOK(`ws:${ip}`,WS_RATE_PER_MIN))throw new Error('ws rate limit'); buf=Buffer.concat([buf,chunk]); if(buf.length>MAX_FRAME_BYTES*2)throw new Error('buffer too large');
        const parsed=parseFrames(buf);buf=parsed.rest;
        for(const f of parsed.frames){
          if(f.opcode===0x8){socket.end();return} if(f.opcode===0x9){socket.write(Buffer.from([0x8A,0x00]));continue} if(f.opcode!==0x1||f.payload.length>MAX_FRAME_BYTES)continue;
          let msg;try{msg=JSON.parse(f.payload.toString('utf8'))}catch{continue}
          if(msg?.type==='hello-auth'){
            if(!safeHelloAuth(msg)){wsSend(socket,{type:'auth-error',reason:'invalid-auth-shape'});continue}
            if(msg.challenge!==challenge){wsSend(socket,{type:'auth-error',reason:'challenge-mismatch'});continue}
            const card=msg.card,expected=pqIdentityId(card),authBytes=Buffer.from(`FREE-AUTH-1:${msg.id}:${msg.challenge}`,'utf8');
            if(expected!==msg.id.toLowerCase()){wsSend(socket,{type:'auth-error',reason:'identity-card-mismatch'});continue}
            if(!(await verifyPqSignatureBytes(msg.signature,authBytes,card.sigPublicKey))){wsSend(socket,{type:'auth-error',reason:'signature-invalid'});continue}
            id=msg.id.toLowerCase();const prior=clients.get(id);if(prior&&prior!==socket&&!prior.destroyed)prior.destroy();clients.set(id,socket);contactCards.set(id,card);announcePresence(id,true);wsSend(socket,{type:'hello-ok',id,serverTime:Date.now(),version:VERSION});const queued=offlineQueue[id]||[];delete offlineQueue[id];saveQueue();for(const q of queued)wsSend(socket,q);continue;
          }
          if(!id)continue;
          if(msg.type==='storage-advertise'){
            if(msg.enabled){storageNodes.add(id);if(validNodeId(msg.nodeId)){const svc=serviceFor(msg.nodeId,id);svc.capacityMb=Math.max(0,Math.min(102400,Number(msg.capacityMb)||0));svc.lastSeen=Date.now();socket.freeNodeServiceId=msg.nodeId;}}
            else {storageNodes.delete(id);}
            const svc=socket.freeNodeServiceId?nodeServices.get(socket.freeNodeServiceId):null;
            wsSend(socket,{type:'storage-status',enabled:storageNodes.has(id),available:storageNodes.size,service:svc?publicService(svc):null});continue}
          if(msg.type==='storage-peers'){const peers=[...storageNodes].filter(x=>x!==id && clients.has(x)).slice(0,20);wsSend(socket,{type:'storage-peers',requestId:msg.requestId,peers});continue}
          if(safeEnvelope(msg)&&msg.from.toLowerCase()===id){const online=route(msg.to,msg,{queue:true});wsSend(socket,{type:'ack',msgId:msg.payload.msgId,queued:!online});continue}
          if(safeContactCard(msg)&&msg.from.toLowerCase()===id){route(msg.to,msg,{queue:true});continue}
          if(safeVaultStore(msg)&&msg.from.toLowerCase()===id){const online=route(msg.to,msg,{queue:false});wsSend(socket,{type:'vault-route-ack',cid:msg.cid,to:msg.to,online});continue}
          if(safeVaultFetch(msg)&&msg.from.toLowerCase()===id){route(msg.to,msg,{queue:false});continue}
          if(safeVaultResponse(msg)&&msg.from.toLowerCase()===id){route(msg.to,msg,{queue:false});continue}
          if(msg.type==='vault-store-ack'&&validId(msg.to)&&validId(msg.from)&&msg.from.toLowerCase()===id&&validCid(msg.cid)){
            const sid=socket.freeNodeServiceId,svc=sid&&nodeServices.get(sid);
            if(svc&&!svc.rewardedCids.has(msg.cid)){svc.rewardedCids.add(msg.cid);const bytes=Math.max(1,Math.min(700000,Number(msg.bytes)||1));svc.storedBytes+=bytes;svc.receipts++;svc.credits+=(bytes/1048576)*SERVICE_CREDIT_PER_MIB;svc.lastSeen=Date.now();wsSend(socket,{type:'service-credit',service:publicService(svc),reason:'encrypted-storage-receipt'});}
            route(msg.to,msg,{queue:false});continue}
          if(msg.type==='delivery'&&validId(msg.to)&&validId(msg.from)&&msg.from.toLowerCase()===id&&typeof msg.msgId==='string'){route(msg.to,msg,{queue:true});continue}
        }
      }catch(err){console.warn('ws closed:',err.message);socket.destroy()}
    });
    const cleanup=()=>{if(id&&clients.get(id)===socket){clients.delete(id);announcePresence(id,false)}if(id)storageNodes.delete(id)};socket.on('close',cleanup);socket.on('error',cleanup);
  }catch{socket.destroy()}
});
server.listen(PORT,'0.0.0.0',()=>{console.log(`${VERSION} node ${NODE_ID} running on port ${PORT}`);schedulePeerConnections()});
