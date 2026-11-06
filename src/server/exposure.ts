import { allInternal } from './store';
import { DomainError } from '../domain/procurement';

export const financialKinds=['payment','service_payment','fee_payment','agreement_execution'] as const;
const notCommitted=new Set(['awaiting_supplier_approval','approved','not_submitted','rejected','cancelled','draft','failed','expired']);
export function sharedExposureAtomic(){return financialKinds.flatMap(kind=>allInternal(kind)).filter(value=>!notCommitted.has(value.status)).reduce((sum,value)=>{if(!/^\d+$/.test(String(value.amountAtomic)))throw new DomainError('A stored financial reservation has invalid atomic units.',409);return sum+BigInt(value.amountAtomic);},0n);}
export function assertSharedAllowance(amountAtomic:string){const cap=process.env.HEDERA_MAX_TOTAL_TINYBAR;if(!cap||!/^\d+$/.test(cap)||!/^\d+$/.test(amountAtomic)||BigInt(amountAtomic)<=0n)throw new DomainError('An explicit shared Hedera testnet transfer cap and positive atomic amount are required.',409);if(sharedExposureAtomic()+BigInt(amountAtomic)>BigInt(cap))throw new DomainError('The shared testnet transfer allowance would be exceeded.',409);}
