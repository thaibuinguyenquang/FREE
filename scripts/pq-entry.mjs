import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

const b64 = bytes => btoa(String.fromCharCode(...bytes));
const unb64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));

globalThis.FREEPQ = Object.freeze({
  suite: 'FREE-PQ1',
  kem: 'ML-KEM-768',
  signature: 'ML-DSA-65',
  kemKeygen() {
    const k = ml_kem768.keygen();
    return { publicKey: b64(k.publicKey), secretKey: b64(k.secretKey) };
  },
  encapsulate(publicKey) {
    const out = ml_kem768.encapsulate(unb64(publicKey));
    return { cipherText: b64(out.cipherText), sharedSecret: b64(out.sharedSecret) };
  },
  decapsulate(cipherText, secretKey) {
    return b64(ml_kem768.decapsulate(unb64(cipherText), unb64(secretKey)));
  },
  sigKeygen() {
    const k = ml_dsa65.keygen();
    return { publicKey: b64(k.publicKey), secretKey: b64(k.secretKey) };
  },
  sign(message, secretKey) {
    return b64(ml_dsa65.sign(message, unb64(secretKey)));
  },
  verify(signature, message, publicKey) {
    return ml_dsa65.verify(unb64(signature), message, unb64(publicKey));
  }
});
