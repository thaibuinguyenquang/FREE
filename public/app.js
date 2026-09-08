const $ = s => document.querySelector(s);
const enc = new TextEncoder();
const dec = new TextDecoder();
const dbName = 'free-v01'; // keep v0.1 DB name so upgrades preserve the existing local identity
let db, me, ws, selectedId = null;
let contacts = {};
let chats = {};

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
const hex = buf => [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
const uuid = () => crypto.randomUUID();

async function openDB(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(dbName,1);
    r.onupgradeneeded=()=>{const d=r.result; if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv')};
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
function getKV(key){return new Promise((res,rej)=>{const t=db.transaction('kv'),r=t.objectStore('kv').get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function setKV(key,val){return new Promise((res,rej)=>{const t=db.transaction('kv','readwrite'),r=t.objectStore('kv').put(val,key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}

async function exportKey(key){ return await crypto.subtle.exportKey('jwk',key); }
async function importECDH(jwk, priv=false){ return crypto.subtle.importKey('jwk',jwk,{name:'ECDH',namedCurve:'P-256'},true,priv?['deriveBits']:[]); }
async function importECDSA(jwk, usage=['verify']){ return crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},true,usage); }

async function ensureIdentity(){
  const saved=await getKV('identity');
  if(saved){
    return {
      id:saved.id,
      dhPriv:await importECDH(saved.dhPriv,true), dhPub:await importECDH(saved.dhPub,false),
      sigPriv:await importECDSA(saved.sigPriv,['sign']), sigPub:await importECDSA(saved.sigPub,['verify']),
      dhPubJwk:saved.dhPub, sigPubJwk:saved.sigPub
    };
  }
  const dh=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
  const sig=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const dhPub=await exportKey(dh.publicKey), dhPriv=await exportKey(dh.privateKey), sigPub=await exportKey(sig.publicKey), sigPriv=await exportKey(sig.privateKey);
  const digest=await crypto.subtle.digest('SHA-256', enc.encode(JSON.stringify({dh:dhPub,sig:sigPub})));
  const id=hex(digest).slice(0,40);
  await setKV('identity',{id,dhPub,dhPriv,sigPub,sigPriv});
  return {id,dhPriv:dh.privateKey,dhPub:dh.publicKey,sigPriv:sig.privateKey,sigPub:sig.publicKey,dhPubJwk:dhPub,sigPubJwk:sigPub};
}

function inviteObject(){ return { v:1, id:me.id, dh:me.dhPubJwk, sig:me.sigPubJwk }; }
function inviteLink(){ return `${location.origin}${location.pathname}#free=${encodeURIComponent(btoa(JSON.stringify(inviteObject())))}`; }
function parseInvite(raw){
  try{
    const u=new URL(raw,location.href); const token=(u.hash.match(/free=([^&]+)/)||[])[1]; if(!token)throw 0;
    const x=JSON.parse(atob(decodeURIComponent(token)));
    if(x.v!==1||!x.id||!x.dh||!x.sig) throw 0; return x;
  }catch{ throw new Error('Invite link không hợp lệ'); }
}

async function deriveKey(contact){
  const pub=await importECDH(contact.dh,false);
  const bits=await crypto.subtle.deriveBits({name:'ECDH',public:pub},me.dhPriv,256);
  const hkdf=await crypto.subtle.importKey('raw',bits,'HKDF',false,['deriveKey']);
  const pair=[me.id,contact.id].sort().join(':');
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:enc.encode('FREE-v0.1'),info:enc.encode(pair)},hkdf,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}

async function encryptFor(contact, text){
  const key=await deriveKey(contact); const iv=crypto.getRandomValues(new Uint8Array(12)); const sentAt=Date.now(); const msgId=uuid();
  const aad=enc.encode(`${me.id}|${contact.id}|${msgId}|${sentAt}`);
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,enc.encode(text));
  const signed=enc.encode(`${me.id}|${contact.id}|${msgId}|${sentAt}|${b64(iv)}|${b64(ciphertext)}`);
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},me.sigPriv,signed);
  return {ciphertext:b64(ciphertext),iv:b64(iv),signature:b64(signature),sentAt,msgId};
}
async function decryptFrom(contact, payload){
  const verifyKey=await importECDSA(contact.sig,['verify']);
  const signed=enc.encode(`${contact.id}|${me.id}|${payload.msgId}|${payload.sentAt}|${payload.iv}|${payload.ciphertext}`);
  const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},verifyKey,unb64(payload.signature),signed);
  if(!ok) throw new Error('bad signature');
  const key=await deriveKey(contact); const aad=enc.encode(`${contact.id}|${me.id}|${payload.msgId}|${payload.sentAt}`);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(payload.iv),additionalData:aad},key,unb64(payload.ciphertext));
  return dec.decode(plain);
}

function persist(){ setKV('contacts',contacts); setKV('chats',chats); }
function renderContacts(){
  const root=$('#contacts'); root.innerHTML='';
  Object.values(contacts).forEach(c=>{
    const d=document.createElement('div'); d.className='contact'+(selectedId===c.id?' active':'');
    d.innerHTML=`<strong>${escapeHtml(c.name||('FREE '+c.id.slice(0,8)))}</strong><div class="mono muted">${c.id}</div>`;
    d.onclick=()=>selectContact(c.id); root.appendChild(d);
  });
}
function selectContact(id){ selectedId=id; const c=contacts[id]; $('#chatTitle').textContent=c.name||('FREE '+id.slice(0,8)); $('#chatSub').textContent=id; $('#messageInput').disabled=false; $('#sendBtn').disabled=false; renderContacts(); renderMessages(); }
function renderMessages(){
  const root=$('#messages'); root.innerHTML=''; if(!selectedId)return;
  for(const m of (chats[selectedId]||[])){
    const d=document.createElement('div'); d.className='msg '+(m.from===me.id?'me':'them');
    d.innerHTML=`${escapeHtml(m.text)}<span class="time">${new Date(m.sentAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>`; root.appendChild(d);
  }
  root.scrollTop=root.scrollHeight;
}
function escapeHtml(s){ return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function connect(){
  const proto=location.protocol==='https:'?'wss':'ws'; ws=new WebSocket(`${proto}://${location.host}/ws`);
  ws.onopen=()=>{ $('#status').textContent='connected'; ws.send(JSON.stringify({type:'hello',id:me.id})); };
  ws.onclose=()=>{ $('#status').textContent='offline'; setTimeout(connect,1500); };
  ws.onmessage=async e=>{
    let msg; try{msg=JSON.parse(e.data)}catch{return}
    if(msg.type==='envelope'&&msg.to.toLowerCase()===me.id.toLowerCase()){
      const c=contacts[msg.from]; if(!c)return;
      try{
        const text=await decryptFrom(c,msg.payload);
        chats[c.id]=chats[c.id]||[];
        if(!chats[c.id].some(x=>x.msgId===msg.payload.msgId)) chats[c.id].push({msgId:msg.payload.msgId,from:c.id,to:me.id,text,sentAt:msg.payload.sentAt});
        persist(); if(selectedId===c.id)renderMessages();
      }catch(err){ console.warn('Rejected envelope',err); }
    }
  };
}

async function addContactFrom(raw){
  const inv=parseInvite(raw); if(inv.id===me.id) throw new Error('Đây là identity của bạn');
  contacts[inv.id]={id:inv.id,dh:inv.dh,sig:inv.sig,name:'FREE '+inv.id.slice(0,8)}; await persist(); renderContacts(); selectContact(inv.id);
}

async function init(){
  db=await openDB(); me=await ensureIdentity(); contacts=(await getKV('contacts'))||{}; chats=(await getKV('chats'))||{};
  $('#fingerprint').textContent=me.id; renderContacts(); connect();
  $('#shareBtn').onclick=()=>{ const p=$('#sharePanel'); p.classList.toggle('hidden'); if(!p.classList.contains('hidden')){ const link=inviteLink(); $('#inviteLink').value=link; $('#qr').src='/api/qr?text='+encodeURIComponent(link); } };
  $('#copyInvite').onclick=()=>navigator.clipboard.writeText($('#inviteLink').value);
  $('#addContact').onclick=async()=>{ try{await addContactFrom($('#inviteInput').value.trim()); $('#inviteInput').value='';}catch(e){alert(e.message)} };
  $('#composer').onsubmit=async ev=>{ ev.preventDefault(); const input=$('#messageInput'); const text=input.value.trim(); if(!text||!selectedId)return; const c=contacts[selectedId]; const payload=await encryptFor(c,text); const env={type:'envelope',from:me.id,to:c.id,payload}; chats[c.id]=chats[c.id]||[]; chats[c.id].push({msgId:payload.msgId,from:me.id,to:c.id,text,sentAt:payload.sentAt}); persist(); renderMessages(); input.value=''; if(ws?.readyState===1)ws.send(JSON.stringify(env)); else alert('Relay đang offline. Tin nhắn chưa được gửi.'); };
  if(location.hash.includes('free=')){ try{ await addContactFrom(location.href); history.replaceState(null,'',location.pathname); }catch(e){ console.warn(e); } }
}
init();
