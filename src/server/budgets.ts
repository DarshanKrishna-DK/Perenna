import { DomainError } from '../domain/procurement';
import { list, put, get } from './store';
export function validTimezone(value:string){try{new Intl.DateTimeFormat('en',{timeZone:value}).format();return true;}catch{return false;}}
export function businessDay(now:number,timezone:string){if(!validTimezone(timezone))throw new DomainError('Choose a valid IANA business timezone.');const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));return ['year','month','day'].map(type=>parts.find(part=>part.type===type)?.value).join('-');}
export function reserveAuthority(tenant:string,id:string,kind:'procurement'|'operating',amount:string,sessionId:string,policy:Record<string,any>,now=Date.now()){
 if(!sessionId||!/^\d+$/.test(amount)||BigInt(amount)<=0n)throw new DomainError('An authenticated session scope and positive reservation are required.',409);
 const prior=get('cap_reservation',tenant,id);if(prior){if(prior.amount!==amount||prior.sessionId!==sessionId||prior.kind!==kind||prior.status==='released')throw new DomainError('Reservation scope changed.',409);return prior;}
 const timezone=policy.businessTimezone||'Asia/Kolkata',day=businessDay(now,timezone);const all=list('cap_reservation',tenant).filter(r=>r.kind===kind&&r.status!=='released');
 const fields=kind==='procurement'?['procurementPerOrderCapMinor','procurementSessionCapMinor','procurementDailyCapMinor']:['operatingPerCallCapAtomic','operatingSessionCapAtomic','operatingDailyCapAtomic'];
 const caps=fields.map(field=>{const raw=policy[field]??(kind==='procurement'?policy.goodsCapMinor:0);if(!/^\d+$/.test(String(raw)))throw new DomainError('Spending cap configuration is invalid.',409);return BigInt(raw);});const value=BigInt(amount);
 const session=all.filter(r=>r.sessionId===sessionId).reduce((sum,r)=>sum+BigInt(r.amount),0n);const daily=all.filter(r=>r.status==='reserved'||businessDay(Date.parse(r.spentAt||r.createdAt),timezone)===day).reduce((sum,r)=>sum+BigInt(r.amount),0n);
 if(value>caps[0]||session+value>caps[1]||daily+value>caps[2])throw new DomainError('The per-order, login-session or business-day spending cap would be exceeded.',409);
 return put('cap_reservation',tenant,{id,kind,amount,sessionId,policyVersion:policy.policyVersion,businessDay:day,timezone,status:'reserved',createdAt:new Date(now).toISOString()});
}
export function settleAuthority(tenant:string,id:string){const record=get('cap_reservation',tenant,id);if(record&&record.status==='reserved')put('cap_reservation',tenant,{...record,status:'spent',spentAt:new Date().toISOString()});}
export function releaseAuthority(tenant:string,id:string){const record=get('cap_reservation',tenant,id);if(record&&record.status==='reserved')put('cap_reservation',tenant,{...record,status:'released',releasedAt:new Date().toISOString()});}
export function authoritySummary(tenant:string){return list('cap_reservation',tenant);}
