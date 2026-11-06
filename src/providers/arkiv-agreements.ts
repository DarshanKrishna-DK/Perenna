import {addr, defineSchema, str, u64} from '@arkiv-network/sdk/schema';
import {and, eq} from '@arkiv-network/sdk/query';
import {isAddress, type Address, type Hex} from 'viem';
import {z} from 'zod';
import {arkivClient, guardedCreate, quoteCreate, type WriteAuthorization} from './arkiv';
import {isProviderError, ProviderError} from './config';

export const AgreementDiscovery = defineSchema('perenna.agreement-discovery.v1', {
  agreementCommitment:str().indexed(), businessCommitment:str().indexed(),
  termsCommitment:str(), item:str().indexed(), unit:str(), area:str().indexed(),
  indexStatus:str(), agreementVersion:u64(), indexVersion:u64(), startsMs:u64(), expiresMs:u64().indexed(),
  createdMs:u64(), schemaVersion:str(),
});
const commitment=z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const instant=z.number().int().positive().safe();
const projectionSchema=z.object({
  agreementCommitment:commitment, businessCommitment:commitment, termsCommitment:commitment,
  item:z.string().min(1).max(120), unit:z.string().min(1).max(30), area:z.enum(['Mumbai','Pune']),
  indexStatus:z.enum(['proposed','active','paused','closed']), agreementVersion:z.number().int().positive().safe(), indexVersion:z.number().int().positive().safe(),
  startsMs:instant, expiresMs:instant, createdMs:instant,
}).strict().refine(v=>v.startsMs<v.expiresMs&&v.createdMs<=Date.now(),'Agreement discovery dates are invalid.');
export type PublicAgreementDiscovery=z.infer<typeof projectionSchema>;
export function parseAgreementDiscovery(input:unknown,requireOpen=true):PublicAgreementDiscovery {
  const parsed=projectionSchema.safeParse(input);
  if(!parsed.success||requireOpen&&parsed.data.expiresMs<=Date.now())
    throw new ProviderError('Arkiv','The public agreement index must contain only valid coarse discovery fields.','INVALID_AGREEMENT_INDEX');
  return parsed.data;
}
function values(input:PublicAgreementDiscovery){return {...input,agreementVersion:u64(BigInt(input.agreementVersion)),indexVersion:u64(BigInt(input.indexVersion)),startsMs:u64(BigInt(input.startsMs)),expiresMs:u64(BigInt(input.expiresMs)),createdMs:u64(BigInt(input.createdMs)),schemaVersion:'1'};}
const value=(row:Record<string,any>,key:string)=>row[key]&&typeof row[key]==='object'&&'value'in row[key]?row[key].value:row[key];
export function matchesAgreementDiscovery(row:Record<string,any>,projection:PublicAgreementDiscovery,writer:Address,entityKey?:Hex){
  try {
    const expected=parseAgreementDiscovery(projection,false);
    if(value(row,'$creator')?.toLowerCase()!==writer.toLowerCase()||value(row,'$owner')?.toLowerCase()!==writer.toLowerCase()||row.$creationFlags?.readonly!==true||row.$creationFlags?.permissionlessExtension!==false||value(row,'schemaVersion')!=='1')return false;
    if(entityKey&&value(row,'$key')?.toLowerCase()!==entityKey.toLowerCase())return false;
    return Object.entries(expected).every(([key,item])=>typeof item==='number'?BigInt(value(row,key))===BigInt(item):value(row,key)===item);
  } catch {return false;}
}
export async function prepareAgreementDiscovery(input:unknown){
  const projection=parseAgreementDiscovery(input);
  return quoteCreate({kind:'agreement_discovery',...projection},projection.expiresMs,(wallet,options)=>wallet.createEntity(AgreementDiscovery,values(projection),options));
}
export async function publishAgreementDiscovery(input:unknown,authorization:WriteAuthorization){
  const projection=parseAgreementDiscovery(input);
  return guardedCreate({kind:'agreement_discovery',...projection},projection.expiresMs,authorization,(wallet,options)=>wallet.createEntity(AgreementDiscovery,values(projection),options),async(result,writer)=>{
    const row=await arkivClient().getEntity(result.entityKey,AgreementDiscovery);
    if(!matchesAgreementDiscovery(row,projection,writer,result.entityKey)||row.$expiresAt!==result.expiresAt)
      throw new ProviderError('Arkiv','The confirmed agreement index differs from the reviewed projection.','READBACK_MISMATCH');
    return {entityKey:result.entityKey,transactionHash:result.txHash,writer,expiresAtBlock:result.expiresAt.toString(),confirmed:true};
  });
}
export async function reconcileAgreementDiscovery(input:unknown){
  const projection=parseAgreementDiscovery(input,false);
  const {reconcileArkivCreate}=await import('./arkiv-reconciliation');
  return reconcileArkivCreate({kind:'agreement_discovery',...projection},(wallet,options)=>wallet.createEntity(AgreementDiscovery,values(projection),options),async(result,writer)=>{
    const row=await arkivClient().getEntity(result.entityKey,AgreementDiscovery);
    if(!matchesAgreementDiscovery(row,projection,writer,result.entityKey)||row.$expiresAt!==result.expiresAt)
      throw new ProviderError('Arkiv','The recovered agreement index differs from the frozen projection.','READBACK_MISMATCH');
  });
}
export async function discoverAgreementIndexes(writer:Address,area:'Mumbai'|'Pune'){
  if(!isAddress(writer))throw new ProviderError('Arkiv','A configured publisher is required.','INVALID_PUBLISHER');
  try {
    const client=arkivClient();
    if(await client.getChainId()!==7794095)throw new ProviderError('Arkiv','Only Rabdi discovery is permitted.','NETWORK_MISMATCH');
    const result=await client.select().from(AgreementDiscovery,{onMismatch:'throw'}).where(and(eq('$creator',addr(writer)),eq('area',area))).limit(100).fetch();
    const head=await client.getBlockNumber({cacheTime:0});
    if(result.entities.length>=100)return {entities:[],observedBlock:head.toString(),truncated:true,writer,network:'arkiv:rabdi',authority:'The bounded history is incomplete. No current listing is asserted.'};
    const keys=['agreementCommitment','businessCommitment','termsCommitment','item','unit','area','indexStatus','agreementVersion','indexVersion','startsMs','expiresMs','createdMs'];
    const valid=result.entities.flatMap(row=>{
      try {
        const projection=parseAgreementDiscovery(Object.fromEntries(keys.map(key=>[key,['agreementVersion','indexVersion','startsMs','expiresMs','createdMs'].includes(key)?Number(value(row,key)):value(row,key)])),false);
        const entityKey=value(row,'$key'),expiresAtBlock=BigInt(value(row,'$expiresAt'));
        if(!/^0x[0-9a-fA-F]{64}$/.test(entityKey)||expiresAtBlock<=head||!matchesAgreementDiscovery(row,projection,writer,entityKey))return [];
        return [{...projection,entityKey,expiresAtBlock:expiresAtBlock.toString()}];
      } catch {return [];}
    });
    const latest=new Map<string,typeof valid[number]>(),conflicts=new Set<string>();
    for(const row of valid){const prior=latest.get(row.agreementCommitment);if(!prior||row.indexVersion>prior.indexVersion){latest.set(row.agreementCommitment,row);conflicts.delete(row.agreementCommitment);}else if(row.indexVersion===prior.indexVersion&&row.entityKey!==prior.entityKey)conflicts.add(row.agreementCommitment);}
    const entities=[...latest.values()].filter(row=>!conflicts.has(row.agreementCommitment)&&row.expiresMs>Date.now()&&['proposed','active'].includes(row.indexStatus));
    return {entities,observedBlock:head.toString(),truncated:result.entities.length>=100,writer,network:'arkiv:rabdi',authority:'Discovery snapshots do not authorize orders or payments.'};
  }catch(error){if(isProviderError(error))throw error;throw new ProviderError('Arkiv','Agreement discovery failed. No private transport details are exposed.');}
}
