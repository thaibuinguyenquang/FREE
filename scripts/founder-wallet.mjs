import crypto from 'node:crypto';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

const secret=String(process.env.FOUNDER_GENESIS_SECRET||'').trim();
if(!secret || secret.length<32){
  console.error('Set FOUNDER_GENESIS_SECRET (minimum 32 characters). Never commit it to Git.');
  process.exit(1);
}
const seed=crypto.createHash('sha512').update(`FREE-FOUNDER-GENESIS-1:${secret}`).digest().subarray(0,32);
const k=ml_dsa65.keygen(seed);
const pub=Buffer.from(k.publicKey).toString('base64');
const suffix=crypto.createHash('sha512').update(`FREE-FOUNDER-GENESIS-ADDRESS-1:${pub}`).digest('hex').slice(0,40).toUpperCase();
const address=`FREE1-GENESIS-${suffix}`;
console.log(JSON.stringify({
  role:'Founder/Developer Economic Identity',
  suite:'ML-DSA-65',
  address,
  publicKey:pub,
  note:'The private key is deterministically derived from FOUNDER_GENESIS_SECRET and is never printed.'
},null,2));
