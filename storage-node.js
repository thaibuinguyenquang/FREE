const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {WebSocket}=require('ws');
const {ml_kem768}=require('@noble/post-quantum/ml-kem.js');
const {ml_dsa65}=require('@noble/post-quantum/ml-dsa.js');

const VERSION='FREE-036';
const RELAY=String(process.env.FREE_RELAY_URL||'https://free-relay.onrender.com').replace(/\/$/,'');
const WS_URL=RELAY.replace(/^http/,'ws')+'/ws';
const DATA_DIR=path.resolve(process.env.FREE_STORAGE_DATA_DIR||path.join(__dirname,'free-storage-data'));
const CAPACITY_MB=Math.max(100,Math.min(102400,Number(process.env.FREE_STORAGE_CAPACITY_MB||1024)));
const ID_FILE=path.join(DATA_DIR,'storage-node-identity.json');
const BLOBS=path.join(DATA_DIR,'replicas');
fs.mkdirSync(BLOBS,{recursive:true});
const b64=b=>Buffer.from(b).toString('base64');
const unb64=s=>new Uint8Array(Buffer.from(s,'base64'));
function atomic(file,obj){const t=file+'.tmp';fs.writeFileSync(t,JSON.stringify(obj));fs.renameSync(t,file)}
function makeIdentity(){const kem=ml_kem768.keygen(),sig=ml_dsa65.keygen();const kemPublicKey=b64(kem.publicKey),sigPublicKey=b64(sig.publicKey);const id=crypto.createHash('sha512').update(`FREE-PQ1:${kemPublicKey}:${sigPublicKey}`).digest('hex').slice(0,64);return{v:1,id,deviceId:'DEV-'+crypto.randomBytes(10).toString('hex').toUpperCase(),kemPublicKey,kemSecretKey:b64(kem.secretKey),sigPublicKey,sigSecretKey:b64(sig.secretKey),createdAt:Date.now()}}
let ident;try{ident=JSON.parse(fs.readFileSync(ID_FILE,'utf8'))}catch{ident=makeIdentity();fs.mkdirSync(DATA_DIR,{recursive:true});atomic(ID_FILE,ident)}
const nodeId=crypto.createHash('sha512').update('FREE-STORAGE-NODE-1:'+ident.sigPublicKey).digest('hex').slice(0,64);
function card(){return{v:2,cryptoSuite:'FREE-PQ1',kem:'ML-KEM-768',signature:'ML-DSA-65',id:ident.id,shortId:nodeId.slice(-12),displayName:'FREE Storage Node',kemPublicKey:ident.kemPublicKey,sigPublicKey:ident.sigPublicKey}}
function fileFor(ns,key){const h=crypto.createHash('sha512').update(ns+'\0'+key).digest('hex');return path.join(BLOBS,h+'.json')}
function currentBytes(){let n=0;for(const f of fs.readdirSync(BLOBS)){try{n+=fs.statSync(path.join(BLOBS,f)).size}catch{}}return n}
function allowedNs(ns){return ['easy-recovery','recovery-capsule','account-vault','archive-chunk','archive-manifest'].includes(ns)}
function store(ns,key,value){if(!allowedNs(ns)||typeof key!=='string'||key.length>256)return{ok:false};const payload={v:1,namespace:ns,key,value,storedAt:Date.now()};const text=JSON.stringify(payload);if(Buffer.byteLength(text)>1500000)return{ok:false};const file=fileFor(ns,key);const prior=fs.existsSync(file)?fs.statSync(file).size:0;if(currentBytes()-prior+Buffer.byteLength(text)>CAPACITY_MB*1048576)return{ok:false,full:true};atomic(file,payload);return{ok:true,bytes:Buffer.byteLength(text)}}
function load(ns,key){if(!allowedNs(ns)||typeof key!=='string')return null;try{const x=JSON.parse(fs.readFileSync(fileFor(ns,key),'utf8'));return x.namespace===ns&&x.key===key?x.value:null}catch{return null}}
let retry=1000;
function connect(){console.log(`[${VERSION}] connecting storage node ${nodeId} -> ${WS_URL}`);const ws=new WebSocket(WS_URL);ws.on('open',()=>{retry=1000});ws.on('message',raw=>{let m;try{m=JSON.parse(String(raw))}catch{return}if(m.type==='challenge'){const bytes=Buffer.from(`FREE-AUTH-2:${ident.id}:${ident.deviceId}:${m.challenge}`,'utf8');const signature=b64(ml_dsa65.sign(bytes,unb64(ident.sigSecretKey)));ws.send(JSON.stringify({type:'hello-auth',id:ident.id,deviceId:ident.deviceId,challenge:m.challenge,card:card(),signature}));return}if(m.type==='hello-ok'){console.log(`[${VERSION}] authenticated; advertising ${CAPACITY_MB} MiB`);ws.send(JSON.stringify({type:'storage-advertise',enabled:true,nodeId,capacityMb:CAPACITY_MB}));return}if(m.type==='storage-status'){console.log(`[${VERSION}] online storage nodes: ${m.available||0}`);return}if(m.type==='replica-put'){const r=store(m.namespace,m.key,m.value);ws.send(JSON.stringify({type:'replica-put-ack',namespace:m.namespace,key:m.key,stored:!!r.ok,bytes:r.bytes||0,full:!!r.full}));return}if(m.type==='replica-get'){const value=load(m.namespace,m.key);ws.send(JSON.stringify({type:'replica-get-response',requestId:m.requestId,namespace:m.namespace,key:m.key,found:value!==null,value}));return}});ws.on('close',()=>{console.log(`[${VERSION}] disconnected; retrying`);setTimeout(connect,retry);retry=Math.min(15000,retry*1.7)});ws.on('error',e=>console.warn('storage node socket:',e.message))}
console.log(`FREE Storage Node ${VERSION}`);console.log(`Node ID: ${nodeId}`);console.log(`Data: ${DATA_DIR}`);console.log(`Capacity: ${CAPACITY_MB} MiB`);console.log('Stores ciphertext/network recovery replicas only. It cannot decrypt user messages.');connect();
