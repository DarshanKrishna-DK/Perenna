import {beforeAll,describe,expect,it,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
const provider=vi.hoisted(()=>({intent:vi.fn(),evidence:vi.fn(),publish:vi.fn()}));
vi.mock('../src/providers/arkiv',()=>({reconcileIntentPublication:provider.intent,reconcileEvidencePublication:provider.evidence,publishEvidence:provider.publish}));
import {reconcilePublicIntent,publishPublicIntent,intentPublicationProjection} from '../src/server/intent-publication';
import {reconcileSignedEvidencePublication} from '../src/server/evidence';
import {createIntent,reviseIntent,controlIntent,seedBusiness,updateSettings} from '../src/server/service';
import {get,put} from '../src/server/store';
beforeAll(()=>{process.env.PERENNA_DB_PATH=':memory:';});
function fixture(){const tenant=randomUUID();seedBusiness(tenant,'Recovery');const intent=createIntent(tenant,{item:'coffee beans',unit:'kg',quantity:10,budgetMinor:100000,location:'Mumbai',deadline:new Date(Date.now()+604800000).toISOString()});const projection=intentPublicationProjection(tenant,intent);put('intent',tenant,{...intent,publicationStatus:'unknown',pendingPublication:{projection,preparedAt:new Date().toISOString()}});return {tenant,intent,projection};}
const confirmed={status:'confirmed',confirmed:true,entityKey:'0x'+'11'.repeat(32),transactionHash:'0x'+'22'.repeat(32),writer:'0x'+'33'.repeat(20),expiresAtBlock:'1234',expired:false};
describe('Tenant-scoped frozen publication recovery',()=>{
 it('blocks edits to unresolved publication snapshots while pause and cancellation retain their recovery reference',()=>{
  const value=fixture();const hash='0x'+'88'.repeat(32);const pending={projection:value.projection,transactionHash:hash,preparedAt:new Date().toISOString()};
  for(const status of ['publishing','unknown']){
   put('intent',value.tenant,{...get('intent',value.tenant,value.intent.id),publicationStatus:status,pendingPublication:pending});const before=get('intent',value.tenant,value.intent.id)!;
   expect(()=>reviseIntent(value.tenant,value.intent.id,{item:'coffee beans',unit:'kg',quantity:20,budgetMinor:200000,location:'Mumbai',deadline:value.intent.deadline,expectedVersion:before.version})).toThrow(/[Rr]econcil/);
   expect(get('intent',value.tenant,value.intent.id)).toEqual(before);
  }
  controlIntent(value.tenant,value.intent.id,'pause');expect(get('intent',value.tenant,value.intent.id)?.pendingPublication).toEqual(pending);
  controlIntent(value.tenant,value.intent.id,'cancel');expect(get('intent',value.tenant,value.intent.id)).toMatchObject({status:'cancelled',publicationStatus:'unknown',pendingPublication:pending});
 });
 it('makes retry a read-only recovery of the original projection without another publish',async()=>{const value=fixture();provider.intent.mockResolvedValue(confirmed);await expect(publishPublicIntent(value.tenant,value.intent.id,1)).resolves.toMatchObject({publicationStatus:'confirmed',arkiv:{projection:value.projection}});expect(provider.intent).toHaveBeenLastCalledWith(value.projection);const saved=get('intent',value.tenant,value.intent.id)!;expect(saved.pendingPublication).toBeUndefined();expect(JSON.stringify(saved)).not.toContain('signedTransaction');});
 it('does not promote a recovered prior-policy snapshot into current discovery',async()=>{const value=fixture();updateSettings(value.tenant,{minCredibility:75});provider.intent.mockResolvedValue(confirmed);await expect(reconcilePublicIntent(value.tenant,value.intent.id)).resolves.toMatchObject({publicationStatus:'stale',arkiv:{projection:value.projection}});});
 it('records historical expired confirmation honestly',async()=>{const value=fixture();provider.intent.mockResolvedValue({...confirmed,expired:true});await expect(reconcilePublicIntent(value.tenant,value.intent.id)).resolves.toMatchObject({publicationStatus:'expired',publicationRecovery:{status:'confirmed',expired:true}});});
 it('preserves unknown and the frozen recovery reference on missing receipts',async()=>{const value=fixture();provider.intent.mockResolvedValue({status:'unknown',writer:confirmed.writer,transactionHash:confirmed.transactionHash});await expect(reconcilePublicIntent(value.tenant,value.intent.id)).resolves.toMatchObject({publicationStatus:'unknown',pendingPublication:{projection:value.projection}});});
 it('rejects another tenant before any provider query',async()=>{const value=fixture();const calls=provider.intent.mock.calls.length;await expect(reconcilePublicIntent(randomUUID(),value.intent.id)).rejects.toThrow();expect(provider.intent.mock.calls.length).toBe(calls);});
 it('recovers expired revoked evidence as history without restoring credibility or authority',async()=>{const tenant=randomUUID();const projection={evidenceDigest:'0x'+'44'.repeat(32),subjectCommitment:'0x'+'55'.repeat(32),issuer:confirmed.writer,role:'buyer',outcome:'received',simulated:true,expiresMs:Date.now()-1000,signature:'0x'+'66'.repeat(65),referenceCommitment:'0x'+'77'.repeat(32)};const evidence=put('evidence',tenant,{publicationStatus:'unknown',revoked:true,verified:true,acknowledged:true,pendingPublication:{projection},expiresAt:new Date(projection.expiresMs).toISOString()});provider.evidence.mockResolvedValue({...confirmed,expired:true});const result=await reconcileSignedEvidencePublication(tenant,evidence.id);expect(result).toMatchObject({publicationStatus:'expired',revoked:true,arkivReadBackVerified:false});expect(provider.evidence).toHaveBeenLastCalledWith(projection);expect(provider.publish).not.toHaveBeenCalled();});
});
