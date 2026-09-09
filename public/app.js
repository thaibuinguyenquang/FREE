const $ = s => document.querySelector(s);
const enc = new TextEncoder();
const dec = new TextDecoder();
const dbName = 'free-v01'; // compatibility container; FREE-004 replaces classical identity with PQ identity inside this DB
const CRYPTO_SUITE = 'FREE-PQ1';
const KEM_NAME = 'ML-KEM-768';
const SIG_NAME = 'ML-DSA-65';
let db, me, ws, selectedId = null;
let contacts = {}, chats = {}, pendingVault = new Map();
let storageEnabled = false;
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
const b64url = buf => b64(buf).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64url = str => unb64(str.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4-str.length%4)%4));
const hex = buf => [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
const uuid = () => crypto.randomUUID();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function pq(){if(!globalThis.FREEPQ)throw new Error('Post-quantum runtime is unavailable. Run npm install so FREE can build its PQ runtime.');return globalThis.FREEPQ}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function getKV(key){return new Promise((res,rej)=>{const t=db.transaction('kv'),r=t.objectStore('kv').get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function setKV(key,val){return new Promise((res,rej)=>{const t=db.transaction('kv','readwrite'),r=t.objectStore('kv').put(val,key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function delKV(key){return new Promise((res,rej)=>{const t=db.transaction('kv','readwrite'),r=t.objectStore('kv').delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
async function sha512(data){return new Uint8Array(await crypto.subtle.digest('SHA-512',data))}
async function identityId(kemPub,sigPub){const material=enc.encode(`${CRYPTO_SUITE}:${kemPub}:${sigPub}`);return hex((await sha512(material)).slice(0,32))}
const B32='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function base32(bytes){let bits=0,value=0,out='';for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=B32[(value>>>(bits-5))&31];bits-=5}}if(bits)out+=B32[(value<<(5-bits))&31];return out}
async function shortIdFor(id){const d=await sha512(enc.encode(`FREE-SHORT:${id}`));const body=base32(d.slice(0,7)).slice(0,10);const check=base32(d.slice(7,9)).slice(0,2);return `${body.slice(0,5)}-${body.slice(5)}-${check}`}
async function ensureIdentity(){
  const saved=await getKV('identity');
  if(saved?.cryptoSuite===CRYPTO_SUITE && saved.kemPublicKey && saved.kemSecretKey && saved.sigPublicKey && saved.sigSecretKey){return{...saved,raw:saved}}
  if(saved){
    await setKV('identity-classical-archive',saved);
    if(!(await getKV('pqMigrationDone'))){
      const oldContacts=await getKV('contacts')||{},oldChats=await getKV('chats')||{};
      await setKV('contacts-classical-archive',oldContacts);await setKV('chats-classical-archive',oldChats);
      await setKV('contacts',{});await setKV('chats',{});await setKV('pqMigrationDone',true);await setKV('pqMigrationNotice',true);
    }
  }
  const kem=pq().kemKeygen(),sig=pq().sigKeygen();
  const id=await identityId(kem.publicKey,sig.publicKey),shortId=await shortIdFor(id);
  const raw={v:2,cryptoSuite:CRYPTO_SUITE,kem:KEM_NAME,signature:SIG_NAME,id,shortId,kemPublicKey:kem.publicKey,kemSecretKey:kem.secretKey,sigPublicKey:sig.publicKey,sigSecretKey:sig.secretKey,createdAt:Date.now()};
  await setKV('identity',raw);return{...raw,raw};
}
function cardForMe(){return{v:2,cryptoSuite:CRYPTO_SUITE,kem:KEM_NAME,signature:SIG_NAME,id:me.id,shortId:me.shortId,kemPublicKey:me.kemPublicKey,sigPublicKey:me.sigPublicKey}}
async function validateCard(card){if(!card||card.v!==2||card.cryptoSuite!==CRYPTO_SUITE||card.kem!==KEM_NAME||card.signature!==SIG_NAME||!card.id||!card.kemPublicKey||!card.sigPublicKey)return false;const expected=await identityId(card.kemPublicKey,card.sigPublicKey);return expected===card.id}
async function signObject(obj){return pq().sign(enc.encode(JSON.stringify(obj)),me.sigSecretKey)}
async function verifyObject(obj,signature,sigPublicKey){try{return pq().verify(signature,enc.encode(JSON.stringify(obj)),sigPublicKey)}catch{return false}}
async function messageKey(sharedSecret,from,to,msgId){const base=await crypto.subtle.importKey('raw',unb64(sharedSecret),'HKDF',false,['deriveKey']);return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-512',salt:enc.encode('FREE-PQ1-MESSAGE'),info:enc.encode(`${from}:${to}:${msgId}`)},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
function aadFor(from,to,msgId,sentAt,kemCiphertext){return enc.encode(JSON.stringify({suite:CRYPTO_SUITE,from,to,msgId,sentAt,kemCiphertext}))}
async function saveState(){await setKV('contacts',contacts);await setKV('chats',chats);await setKV('storageEnabled',storageEnabled)}

function inviteLink(){return `${location.origin}/#freeid=${me.id}`}
function renderIdentity(){const link=inviteLink();$('#myId').textContent=me.id;const short=$('#shortId');if(short)short.textContent=me.shortId;$('#inviteLink').value=link;$('#qr').src=`/api/qr?text=${encodeURIComponent(link)}`}
function renderContacts(){const box=$('#contacts');box.innerHTML='';const ids=Object.keys(contacts);if(!ids.length){box.innerHTML='<div class="muted empty">No contacts yet</div>';return}for(const id of ids){const c=contacts[id],b=document.createElement('button');b.className='contact'+(id===selectedId?' active':'');b.innerHTML=`<strong>${esc(c.name||'FREE '+(c.shortId||id.slice(0,10)))}</strong><span>${esc(c.shortId||id)}</span>`;b.onclick=()=>{selectedId=id;renderContacts();renderChat();sendReadDeliveries(id)};box.appendChild(b)}}
function renderChat(){const title=$('#chatTitle'),msgs=$('#messages'),composer=$('#composer');if(!selectedId||!contacts[selectedId]){title.textContent='Select a contact';msgs.innerHTML='<div class="muted empty">Choose a contact to start a post-quantum encrypted conversation.</div>';composer.hidden=true;return}title.textContent=contacts[selectedId].name||`FREE ${contacts[selectedId].shortId||selectedId.slice(0,10)}`;composer.hidden=false;msgs.innerHTML='';for(const m of chats[selectedId]||[]){const d=document.createElement('div');d.className='msg '+(m.from===me.id?'mine':'theirs');const status=m.from===me.id?`<small>${esc(m.status||'sent')}</small>`:'';d.innerHTML=`<div>${esc(m.text)}</div><time>${new Date(m.sentAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time>${status}`;msgs.appendChild(d)}msgs.scrollTop=msgs.scrollHeight}
function status(text,good=true){const e=$('#status');e.textContent=text;e.dataset.good=good?'1':'0'}

async function addContactCard(card,name){if(!(await validateCard(card)))throw new Error('Invalid or non-PQ FREE identity');if(card.id===me.id)throw new Error('This is your own identity');contacts[card.id]={...card,name:name||contacts[card.id]?.name||`FREE ${card.shortId||card.id.slice(0,10)}`};await saveState();renderContacts();return contacts[card.id]}
async function fetchCardById(id){if(!/^[a-f0-9]{64}$/i.test(id))throw new Error('Invalid FREE full identity');const r=await fetch(`/api/card?id=${encodeURIComponent(id)}`,{cache:'no-store'});if(!r.ok)throw new Error('Identity is not currently published on this relay');const card=await r.json();if(!(await validateCard(card))||card.id.toLowerCase()!==id.toLowerCase())throw new Error('Relay returned an invalid identity card');return card}
async function parseInvite(input){const raw=input.trim();let id='';try{const u=new URL(raw,location.origin);id=(u.hash.match(/#freeid=([a-f0-9]{64})/i)||[])[1]||''}catch{}if(!id&&/^[a-f0-9]{64}$/i.test(raw))id=raw;if(!id)throw new Error('Paste a FREE-PQ invite link or full FREE identity');return fetchCardById(id.toLowerCase())}
async function addFromInvite(input){const card=await parseInvite(input);await addContactCard(card);selectedId=card.id;renderContacts();renderChat();if(ws?.readyState===1){const mine=cardForMe();const signature=await signObject(mine);ws.send(JSON.stringify({type:'contact-card',from:me.id,to:card.id,card:mine,signature}))}return card}

function connect(){const proto=location.protocol==='https:'?'wss':'ws';ws=new WebSocket(`${proto}://${location.host}/ws`);ws.onopen=()=>status('authenticating · PQ');ws.onclose=()=>{status('reconnecting…',false);setTimeout(connect,1800)};ws.onerror=()=>status('connection error',false);ws.onmessage=e=>handleWs(JSON.parse(e.data))}
async function handleWs(msg){
  if(msg.type==='challenge'){const card=cardForMe();const signable={type:'hello-auth',id:me.id,challenge:msg.challenge,card};const signature=await signObject(signable);ws.send(JSON.stringify({...signable,signature}));return}
  if(msg.type==='hello-ok'){status('connected · PQ');if(storageEnabled)ws.send(JSON.stringify({type:'storage-advertise',enabled:true}));return}
  if(msg.type==='auth-error'){status('identity authentication failed',false);return}
  if(msg.type==='ack'){for(const id of Object.keys(chats)){const m=(chats[id]||[]).find(x=>x.msgId===msg.msgId);if(m){m.status=msg.queued?'queued':'sent';await saveState();if(id===selectedId)renderChat();break}}return}
  if(msg.type==='delivery'){for(const id of Object.keys(chats)){const m=(chats[id]||[]).find(x=>x.msgId===msg.msgId);if(m){m.status='delivered';await saveState();if(id===selectedId)renderChat();break}}return}
  if(msg.type==='contact-card'){
    const ok=(await validateCard(msg.card))&&await verifyObject(msg.card,msg.signature,msg.card.sigPublicKey);if(ok&&msg.card.id===msg.from){await addContactCard(msg.card);renderContacts()}
    return;
  }
  if(msg.type==='envelope'){await receiveEnvelope(msg);return}
  if(msg.type==='storage-peers'){pendingVault.get(msg.requestId)?.resolve(msg.peers||[]);pendingVault.delete(msg.requestId);return}
  if(msg.type==='vault-store'){await receiveShard(msg);return}
  if(msg.type==='vault-store-ack'){const p=pendingVault.get(`store:${msg.cid}`);if(p){p.acks.add(msg.from);p.update?.()};return}
  if(msg.type==='vault-fetch'){await serveShard(msg);return}
  if(msg.type==='vault-response'){const p=pendingVault.get(msg.requestId);if(p&&msg.share){p.shares.set(msg.cid,msg.share);p.update?.();if(p.shares.size>=p.k)p.resolve([...p.shares.values()])};return}
  if(msg.type==='storage-status'){$('#storageCount').textContent=String(msg.available||0);return}
}
async function sendMessage(text){
  if(!selectedId||!contacts[selectedId])return;const c=contacts[selectedId];if(c.cryptoSuite!==CRYPTO_SUITE)throw new Error('This contact uses an obsolete classical identity. Re-add their FREE-PQ identity.');
  const msgId=uuid(),sentAt=Date.now();const kem=pq().encapsulate(c.kemPublicKey);const key=await messageKey(kem.sharedSecret,me.id,c.id,msgId);const iv=crypto.getRandomValues(new Uint8Array(12));const aad=aadFor(me.id,c.id,msgId,sentAt,kem.cipherText);const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,enc.encode(text));
  const signable={suite:CRYPTO_SUITE,from:me.id,to:c.id,msgId,sentAt,kemCiphertext:kem.cipherText,iv:b64(iv),ciphertext:b64(ciphertext)};const signature=await signObject(signable);const payload={...signable,signature};
  chats[c.id]=chats[c.id]||[];chats[c.id].push({msgId,from:me.id,to:c.id,text,sentAt,status:'sending',suite:CRYPTO_SUITE});await saveState();renderChat();if(ws?.readyState!==1){chats[c.id].at(-1).status='offline';await saveState();renderChat();return}ws.send(JSON.stringify({type:'envelope',from:me.id,to:c.id,payload}))
}
async function receiveEnvelope(msg){
  const c=contacts[msg.from];if(!c||c.cryptoSuite!==CRYPTO_SUITE)return;const p=msg.payload;if(p.suite!==CRYPTO_SUITE||p.from!==msg.from||p.to!==msg.to)return;
  const signable={suite:p.suite,from:p.from,to:p.to,msgId:p.msgId,sentAt:p.sentAt,kemCiphertext:p.kemCiphertext,iv:p.iv,ciphertext:p.ciphertext};const ok=await verifyObject(signable,p.signature,c.sigPublicKey);if(!ok)return;
  try{const shared=pq().decapsulate(p.kemCiphertext,me.kemSecretKey);const key=await messageKey(shared,p.from,p.to,p.msgId);const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(p.iv),additionalData:aadFor(p.from,p.to,p.msgId,p.sentAt,p.kemCiphertext)},key,unb64(p.ciphertext));chats[msg.from]=chats[msg.from]||[];if(!chats[msg.from].some(x=>x.msgId===p.msgId))chats[msg.from].push({msgId:p.msgId,from:msg.from,to:me.id,text:dec.decode(plain),sentAt:p.sentAt,status:'received',suite:CRYPTO_SUITE});await saveState();if(selectedId===msg.from)renderChat();if(ws?.readyState===1)ws.send(JSON.stringify({type:'delivery',from:me.id,to:msg.from,msgId:p.msgId}))}catch(e){console.warn('PQ decrypt failed',e)}
}
async function sendReadDeliveries(){/* reserved for a later protocol version */}

// ---- Distributed encrypted vault (experimental) ----
function gfMul(a,b){let p=0;for(let i=0;i<8;i++){if(b&1)p^=a;const hi=a&0x80;a=(a<<1)&255;if(hi)a^=0x1b;b>>=1}return p}
function gfPow(a,n){let r=1;while(n){if(n&1)r=gfMul(r,a);a=gfMul(a,a);n>>=1}return r}
function gfInv(a){if(!a)throw new Error('GF divide by zero');return gfPow(a,254)}
function gfDiv(a,b){return a?gfMul(a,gfInv(b)):0}
function shamirSplit(data,n=5,k=3){const shares=Array.from({length:n},(_,i)=>({x:i+1,data:new Uint8Array(data.length)}));const coeff=new Uint8Array(k);for(let pos=0;pos<data.length;pos++){coeff[0]=data[pos];crypto.getRandomValues(coeff.subarray(1));for(const sh of shares){let y=coeff[k-1];for(let j=k-2;j>=0;j--)y=gfMul(y,sh.x)^coeff[j];sh.data[pos]=y}}return shares}
function shamirCombine(shares,k=3){const use=shares.slice(0,k),len=use[0].data.length,out=new Uint8Array(len);for(let pos=0;pos<len;pos++){let secret=0;for(let i=0;i<use.length;i++){let li=1;for(let j=0;j<use.length;j++){if(i===j)continue;li=gfMul(li,gfDiv(use[j].x,use[i].x^use[j].x))}secret^=gfMul(use[i].data[pos],li)}out[pos]=secret}return out}
async function sha256hex(data){return hex(await crypto.subtle.digest('SHA-256',data))}
async function deriveRecoveryKey(secret,salt){const material=await crypto.subtle.importKey('raw',secret,'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:250000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function requestStoragePeers(){if(ws?.readyState!==1)throw new Error('Relay is offline');const requestId=uuid();return new Promise((resolve,reject)=>{pendingVault.set(requestId,{resolve,reject});ws.send(JSON.stringify({type:'storage-peers',requestId}));setTimeout(()=>{if(pendingVault.has(requestId)){pendingVault.delete(requestId);reject(new Error('Storage peer lookup timed out'))}},5000)})}
async function createVault(){
  const btn=$('#backupBtn');btn.disabled=true;$('#vaultProgress').textContent='Encrypting your vault…';
  try{
    const peers=await requestStoragePeers();if(peers.length<3)throw new Error(`Need at least 3 volunteer storage nodes online; currently ${peers.length}. Open FREE on more devices and enable Storage Node.`);
    const state={format:'FREE-VAULT-1',createdAt:Date.now(),identity:me.raw,contacts,chats};const plain=enc.encode(JSON.stringify(state));
    const secret=crypto.getRandomValues(new Uint8Array(32)),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const key=await deriveRecoveryKey(secret,salt);const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain));const cipherHash=await sha256hex(encrypted);const shares=shamirSplit(encrypted,5,3);const vaultId=cipherHash.slice(0,32);const manifest=[];
    for(let i=0;i<shares.length;i++){
      const packed=new Uint8Array(1+shares[i].data.length);packed[0]=shares[i].x;packed.set(shares[i].data,1);const cid=await sha256hex(packed);const holders=[];const candidates=[peers[i%peers.length],peers[(i+1)%peers.length]].filter((v,j,a)=>v&&a.indexOf(v)===j);
      for(const holder of candidates){ws.send(JSON.stringify({type:'vault-store',from:me.id,to:holder,vaultId,cid,share:b64(packed)}));holders.push(holder)}
      manifest.push({cid,x:shares[i].x,holders});$('#vaultProgress').textContent=`Distributing encrypted shards ${i+1}/5…`;
    }
    const kit={format:'FREE-RECOVERY-1',vaultId,k:3,n:5,salt:b64url(salt),iv:b64url(iv),secret:b64url(secret),cipherHash,shares:manifest};const text=JSON.stringify(kit);await setKV('lastRecoveryKit',text);$('#recoveryKit').value=text;$('#vaultProgress').textContent='Vault distributed. Keep the Recovery Kit offline and private.';downloadText(`FREE-Recovery-${vaultId}.free-recovery`,text);
  }finally{btn.disabled=false}
}
async function receiveShard(msg){if(!storageEnabled)return;const packed=unb64(msg.share);if(await sha256hex(packed)!==msg.cid)return;await setKV(`shard:${msg.cid}`,{vaultId:msg.vaultId,cid:msg.cid,share:msg.share,owner:msg.from,storedAt:Date.now()});let idx=await getKV('shard-index')||[];if(!idx.includes(msg.cid))idx.push(msg.cid);await setKV('shard-index',idx.slice(-200));if(ws?.readyState===1)ws.send(JSON.stringify({type:'vault-store-ack',from:me.id,to:msg.from,cid:msg.cid}))}
async function serveShard(msg){if(!storageEnabled)return;const rec=await getKV(`shard:${msg.cid}`);if(rec&&ws?.readyState===1)ws.send(JSON.stringify({type:'vault-response',from:me.id,to:msg.from,requestId:msg.requestId,cid:msg.cid,share:rec.share}))}
async function restoreVault(){
  const raw=$('#recoveryKit').value.trim();if(!raw)throw new Error('Paste your FREE Recovery Kit first');const kit=JSON.parse(raw);if(kit.format!=='FREE-RECOVERY-1')throw new Error('Invalid Recovery Kit');if(ws?.readyState!==1)throw new Error('Relay is offline');
  $('#vaultProgress').textContent='Looking for your encrypted shards…';const requestId=uuid();const shares=new Map();const p=new Promise((resolve,reject)=>{pendingVault.set(requestId,{resolve,reject,shares,k:kit.k,update:()=>{$('#vaultProgress').textContent=`Recovered ${shares.size}/${kit.k} required shards…`}});setTimeout(()=>reject(new Error('Not enough shard holders are online yet')),12000)});
  for(const sh of kit.shares)for(const holder of sh.holders||[])ws.send(JSON.stringify({type:'vault-fetch',from:me.id,to:holder,requestId,cid:sh.cid}));
  await p;pendingVault.delete(requestId);const unpacked=[];for(const [cid,s] of shares){const packed=unb64(s);if(await sha256hex(packed)!==cid)continue;unpacked.push({x:packed[0],data:packed.slice(1)});if(unpacked.length>=kit.k)break}if(unpacked.length<kit.k)throw new Error('Recovered shards failed integrity checks');
  const encrypted=shamirCombine(unpacked,kit.k);if(await sha256hex(encrypted)!==kit.cipherHash)throw new Error('Vault reconstruction hash mismatch');const key=await deriveRecoveryKey(unb64url(kit.secret),unb64url(kit.salt));const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64url(kit.iv)},key,encrypted);const state=JSON.parse(dec.decode(plain));if(state.format!=='FREE-VAULT-1'||!state.identity?.id)throw new Error('Invalid decrypted FREE vault');
  await setKV('identity',state.identity);await setKV('contacts',state.contacts||{});await setKV('chats',state.chats||{});$('#vaultProgress').textContent='Identity and data restored. Reloading FREE…';setTimeout(()=>location.reload(),700);
}
function downloadText(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function toggleStorage(){storageEnabled=$('#storageToggle').checked;await saveState();if(ws?.readyState===1)ws.send(JSON.stringify({type:'storage-advertise',enabled:storageEnabled}));$('#storageState').textContent=storageEnabled?'This device volunteers encrypted shard storage.':'Storage contribution is off.'}

async function init(){
  db=await openDB();me=await ensureIdentity();contacts=await getKV('contacts')||{};chats=await getKV('chats')||{};storageEnabled=!!(await getKV('storageEnabled'));$('#storageToggle').checked=storageEnabled;$('#storageState').textContent=storageEnabled?'This device volunteers encrypted shard storage.':'Storage contribution is off.';renderIdentity();renderContacts();renderChat();connect();
  const hash=location.hash;if(hash.startsWith('#freeid=')){try{await addFromInvite(location.href);history.replaceState(null,'',location.pathname)}catch(e){alert(e.message)}}
  if(await getKV('pqMigrationNotice')){await delKV('pqMigrationNotice');setTimeout(()=>alert('FREE upgraded this browser from the classical prototype to FREE-PQ1. A new post-quantum identity was created. Old classical identity, contacts and chats were archived locally and are not used on the PQ security path.'),250)}
  const kit=await getKV('lastRecoveryKit');if(kit)$('#recoveryKit').value=kit;
}

$('#copyInvite').onclick=async()=>{await navigator.clipboard.writeText(inviteLink());$('#copyInvite').textContent='Copied';setTimeout(()=>$('#copyInvite').textContent='Copy link',1200)};
$('#shareInvite').onclick=async()=>{const url=inviteLink();if(navigator.share)await navigator.share({title:'FREE identity',text:'Add me on FREE',url});else{await navigator.clipboard.writeText(url);alert('Invite link copied')}};
$('#addContact').onclick=async()=>{try{await addFromInvite($('#inviteInput').value);$('#inviteInput').value=''}catch(e){alert(e.message)}};
$('#composer').onsubmit=async e=>{e.preventDefault();const input=$('#messageInput'),text=input.value.trim();if(!text)return;input.value='';try{await sendMessage(text)}catch(err){alert(err.message)}};
$('#storageToggle').onchange=toggleStorage;
$('#backupBtn').onclick=()=>createVault().catch(e=>{alert(e.message);$('#vaultProgress').textContent=e.message;$('#backupBtn').disabled=false});
$('#restoreBtn').onclick=()=>restoreVault().catch(e=>{alert(e.message);$('#vaultProgress').textContent=e.message});
$('#copyKit').onclick=async()=>{await navigator.clipboard.writeText($('#recoveryKit').value);$('#copyKit').textContent='Copied';setTimeout(()=>$('#copyKit').textContent='Copy kit',1200)};
init().catch(e=>{console.error(e);status('startup error',false);alert(`FREE startup error: ${e.message}`)});
