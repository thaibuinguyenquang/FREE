'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const YEAR_SECONDS = 365.2425 * 24 * 60 * 60;
const stable = value => {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+stable(value[k])).join(',') + '}';
  return JSON.stringify(value);
};
const sha512_256 = x => crypto.createHash('sha512').update(typeof x === 'string' ? x : stable(x)).digest('hex').slice(0,64);
const atomic = (file,obj) => { const tmp=`${file}.${process.pid}.tmp`; fs.writeFileSync(tmp,JSON.stringify(obj,null,2)); fs.renameSync(tmp,file); };
const seed32 = secret => crypto.createHash('sha512').update(`FREE-FOUNDER-GENESIS-1:${secret}`).digest().subarray(0,32);

class FreeChain {
  constructor({dataDir, pqModule, version='FREE-013'}) {
    this.dataDir=dataDir; this.pqModule=pqModule; this.version=version;
    this.file=path.join(dataDir,'free-chain-testnet-2.json');
    this.legacyFile=path.join(dataDir,'free-chain-testnet.json');
    this.authorityFile=path.join(dataDir,'chain-authority-pq-testnet-2.json');
    this.timer=null; this.chain=null; this.authority=null; this.founder=null;
  }
  async init() {
    fs.mkdirSync(this.dataDir,{recursive:true});
    const {ml_dsa65}=await this.pqModule;
    try { this.authority=JSON.parse(fs.readFileSync(this.authorityFile,'utf8')); }
    catch { const k=ml_dsa65.keygen(); this.authority={suite:'ML-DSA-65',publicKey:Buffer.from(k.publicKey).toString('base64'),secretKey:Buffer.from(k.secretKey).toString('base64'),createdAt:Date.now()}; atomic(this.authorityFile,this.authority); }

    const founderSecret=String(process.env.FOUNDER_GENESIS_SECRET||'').trim();
    if(!founderSecret || founderSecret.length < 32) throw new Error('FOUNDER_GENESIS_SECRET is required (minimum 32 characters) so the Founder Genesis Address remains stable across redeploys');
    const fk=ml_dsa65.keygen(seed32(founderSecret));
    const publicKey=Buffer.from(fk.publicKey).toString('base64');
    const secretKey=Buffer.from(fk.secretKey).toString('base64');
    const address='FREE1-GENESIS-'+sha512_256(`FREE-FOUNDER-GENESIS-ADDRESS-1:${publicKey}`).slice(0,40).toUpperCase();
    this.founder={suite:'ML-DSA-65',address,publicKey,secretKey};

    try {
      this.chain=JSON.parse(fs.readFileSync(this.file,'utf8'));
      this.validate();
      const existing=this.chain?.state?.addresses?.founder;
      if(existing!==address) throw new Error(`Founder Genesis Address mismatch: stored=${existing} configured=${address}. Do not change FOUNDER_GENESIS_SECRET after genesis.`);
      if(this.chain?.state?.founder?.publicKey!==publicKey) throw new Error('Founder Genesis public key mismatch. Do not change FOUNDER_GENESIS_SECRET after genesis.');
    } catch (err) {
      if(fs.existsSync(this.file)) throw err;
      this.chain=this.makeGenesis(); atomic(this.file,this.chain);
    }
    return this;
  }
  legacyReference() {
    if(!fs.existsSync(this.legacyFile)) return null;
    try {
      const old=JSON.parse(fs.readFileSync(this.legacyFile,'utf8'));
      const blocks=Array.isArray(old?.blocks)?old.blocks:[];
      if(!blocks.length) return null;
      return {
        chainId:String(old.chainId||'free-testnet-1'),
        genesisHash:String(blocks[0]?.hash||''),
        latestHash:String(blocks.at(-1)?.hash||''),
        finalHeight:Number(blocks.at(-1)?.header?.height||0),
        archivedReadOnly:true
      };
    } catch { return {chainId:'free-testnet-1',unreadable:true,archivedReadOnly:true}; }
  }
  makeGenesis() {
    const founderAddress=this.founder.address;
    const nodePool='FREE1-NODEPOOL-'+sha512_256('FREE-NODE-POOL').slice(0,32).toUpperCase();
    const ecosystem='FREE1-ECOSYSTEM-'+sha512_256('FREE-ECOSYSTEM').slice(0,32).toUpperCase();
    const treasury='FREE1-TREASURY-'+sha512_256('FREE-TREASURY').slice(0,32).toUpperCase();
    const genesisReserve='FREE1-GENESISRESERVE-'+sha512_256('FREE-GENESIS-RESERVE-2').slice(0,32).toUpperCase();
    const hardMaxGrossInflation=0.04;
    const requestedInflation=Number(process.env.CHAIN_ANNUAL_INFLATION||0.025);
    if(!Number.isFinite(requestedInflation)||requestedInflation<0||requestedInflation>hardMaxGrossInflation) throw new Error('FREE monetary invariant: annual gross issuance must be between 0% and 4%');
    const policy={id:'FREE-CHAIN-ECON-2',annualInflationRate:requestedInflation,hardMaxGrossInflation,epochSeconds:Math.max(60,Number(process.env.CHAIN_EPOCH_SECONDS||60)),founderShare:Number(process.env.CHAIN_FOUNDER_SHARE||0.10),nodeShare:Number(process.env.CHAIN_NODE_SHARE||0.65),ecosystemShare:Number(process.env.CHAIN_ECOSYSTEM_SHARE||0.15),treasuryShare:Number(process.env.CHAIN_TREASURY_SHARE||0.10),feeBurnShare:Math.max(0,Math.min(1,Number(process.env.CHAIN_FEE_BURN_SHARE||0.30)))};
    const sum=policy.founderShare+policy.nodeShare+policy.ecosystemShare+policy.treasuryShare;
    if(Math.abs(sum-1)>1e-9) throw new Error('FREE Chain allocation shares must sum to 1');
    const genesisSupply=Number(process.env.CHAIN_GENESIS_SUPPLY||500000000);
    const founderGenesisShare=0.15;
    const founderGenesisAllocation=genesisSupply*founderGenesisShare;
    const genesisReserveAllocation=genesisSupply-founderGenesisAllocation;
    const state={
      supply:genesisSupply,
      balances:{[founderAddress]:founderGenesisAllocation,[genesisReserve]:genesisReserveAllocation,[nodePool]:0,[ecosystem]:0,[treasury]:0},
      addresses:{founder:founderAddress,genesisReserve,nodePool,ecosystem,treasury},
      founder:{role:'Founder/Developer Economic Identity',suite:this.founder.suite,address:founderAddress,publicKey:this.founder.publicKey,genesisShare:founderGenesisShare,genesisAllocation:founderGenesisAllocation},
      genesisReserve:{address:genesisReserve,allocation:genesisReserveAllocation,locked:true,purpose:'Unallocated Genesis Reserve pending mainnet tokenomics simulation; not Founder property'},
      migration:{from:this.legacyReference(),kind:'new-genesis-no-history-rewrite'},
      monetary:{grossIssued:0,totalBurned:0,netSupplyChange:0},
      policy,
      securityEpoch:{id:'FREE-SECURITY-EPOCH-1',chainSignature:'ML-DSA-65',messagingSuite:'FREE-PQ1'}
    };
    const header={height:0,previousHash:'0'.repeat(64),timestamp:Date.now(),epoch:0,validator:'GENESIS',stateRoot:sha512_256(state),txRoot:sha512_256([]),protocol:'FREE-CHAIN-TESTNET-2'};
    const block={header,transactions:[],signature:null}; block.hash=sha512_256({header,transactions:block.transactions});
    return {network:'FREE Chain Freedom Economy Testnet-2',chainId:'free-testnet-2',createdAt:header.timestamp,authority:{suite:'ML-DSA-65',publicKey:this.authority.publicKey,address:'FREE1-AUTHORITY-'+sha512_256(this.authority.publicKey).slice(0,32).toUpperCase()},state,blocks:[block],lastEpochAt:header.timestamp};
  }
  validate() {
    if(!this.chain?.blocks?.length) throw new Error('empty chain');
    for(let i=0;i<this.chain.blocks.length;i++){
      const b=this.chain.blocks[i]; const expected=sha512_256({header:b.header,transactions:b.transactions});
      if(b.hash!==expected)throw new Error(`bad block hash ${i}`);
      if(i&&b.header.previousHash!==this.chain.blocks[i-1].hash)throw new Error(`broken chain link ${i}`);
    }
    if(this.chain.blocks.at(-1).header.stateRoot!==sha512_256(this.chain.state)) throw new Error('state root mismatch');
    if(this.chain.chainId!=='free-testnet-2') throw new Error('wrong chain id for Testnet-2');
    const p=this.chain?.state?.policy; if(!p||p.hardMaxGrossInflation!==0.04||p.annualInflationRate<0||p.annualInflationRate>0.04) throw new Error('FREE monetary invariant violated');
    const totalBalances=Object.values(this.chain.state.balances||{}).reduce((a,b)=>a+Number(b||0),0);
    if(Math.abs(totalBalances-this.chain.state.supply)>0.01) throw new Error('supply conservation invariant violated');
  }
  emission() { const p=this.chain.state.policy; return this.chain.state.supply*p.annualInflationRate*(p.epochSeconds/YEAR_SECONDS); }
  async produceInflationBlock() {
    const p=this.chain.state.policy, emission=this.emission();
    const allocations={founder:emission*p.founderShare,nodes:emission*p.nodeShare,ecosystem:emission*p.ecosystemShare,treasury:emission*p.treasuryShare};
    const a=this.chain.state.addresses;
    this.chain.state.supply+=emission; this.chain.state.monetary.grossIssued+=emission; this.chain.state.monetary.netSupplyChange=this.chain.state.monetary.grossIssued-this.chain.state.monetary.totalBurned; this.chain.state.balances[a.founder]+=allocations.founder; this.chain.state.balances[a.nodePool]+=allocations.nodes; this.chain.state.balances[a.ecosystem]+=allocations.ecosystem; this.chain.state.balances[a.treasury]+=allocations.treasury;
    const height=this.chain.blocks.length, epoch=this.chain.blocks.at(-1).header.epoch+1;
    const tx={type:'protocol-inflation',epoch,policyId:p.id,emission,allocations,recipients:{founder:a.founder,nodes:a.nodePool,ecosystem:a.ecosystem,treasury:a.treasury}};
    const header={height,previousHash:this.chain.blocks.at(-1).hash,timestamp:Date.now(),epoch,validator:this.chain.authority.address,stateRoot:sha512_256(this.chain.state),txRoot:sha512_256([tx]),protocol:'FREE-CHAIN-TESTNET-2'};
    const signBytes=Buffer.from(stable({header,transactions:[tx]})); const {ml_dsa65}=await this.pqModule;
    const signature=Buffer.from(ml_dsa65.sign(signBytes,Buffer.from(this.authority.secretKey,'base64'))).toString('base64');
    const block={header,transactions:[tx],signature:{suite:'ML-DSA-65',value:signature}}; block.hash=sha512_256({header,transactions:block.transactions});
    this.chain.blocks.push(block); this.chain.lastEpochAt=header.timestamp; atomic(this.file,this.chain); return block;
  }
  async settle() { const p=this.chain.state.policy; let n=0; while(Date.now()-this.chain.lastEpochAt>=p.epochSeconds*1000 && n<100){await this.produceInflationBlock();n++;} return n; }
  start() { if(this.timer)return; this.timer=setInterval(()=>this.settle().catch(e=>console.error('FREE Chain epoch error:',e.message)),5000); this.timer.unref(); }
  publicFounder() {
    const s=this.chain.state, a=s.addresses.founder;
    return {role:s.founder.role,address:a,suite:s.founder.suite,publicKey:s.founder.publicKey,genesisShare:s.founder.genesisShare,genesisAllocation:Number(s.founder.genesisAllocation.toFixed(6)),balance:Number(s.balances[a].toFixed(6)),rewardSource:'15% genesis allocation + 10% of future protocol emission',privateKeyExposed:false,testnet:true};
  }
  publicSummary() { const last=this.chain.blocks.at(-1),s=this.chain.state,a=s.addresses; return {network:this.chain.network,chainId:this.chain.chainId,protocol:'FREE-CHAIN-TESTNET-2',height:last.header.height,latestBlockHash:last.hash,genesisHash:this.chain.blocks[0].hash,founderGenesis:this.publicFounder(),validatorAuthority:{address:this.chain.authority.address,suite:this.chain.authority.suite,publicKey:this.chain.authority.publicKey},securityEpoch:s.securityEpoch,policy:s.policy,supply:Number(s.supply.toFixed(6)),balances:{founder:Number(s.balances[a.founder].toFixed(6)),genesisReserve:Number(s.balances[a.genesisReserve].toFixed(6)),nodePool:Number(s.balances[a.nodePool].toFixed(6)),ecosystem:Number(s.balances[a.ecosystem].toFixed(6)),treasury:Number(s.balances[a.treasury].toFixed(6))},genesisReserve:s.genesisReserve,migration:s.migration,monetary:{...s.monetary,grossIssued:Number(s.monetary.grossIssued.toFixed(6)),totalBurned:Number(s.monetary.totalBurned.toFixed(6)),netSupplyChange:Number(s.monetary.netSupplyChange.toFixed(6)),burnImplemented:false},addresses:a,nextEpochAt:this.chain.lastEpochAt+s.policy.epochSeconds*1000,postQuantumSignedBlocks:true,monetaryValue:false,testnet:true}; }
  blocks(limit=20){return this.chain.blocks.slice(-Math.max(1,Math.min(100,limit))).map(b=>({...b,transactions:b.transactions.map(t=>({...t,emission:t.emission===undefined?undefined:Number(t.emission.toFixed(6))}))}));}
}
module.exports={FreeChain};
