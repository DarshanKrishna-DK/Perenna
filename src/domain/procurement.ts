import { normalizeItem, normalizeUnit, normalizeCity } from './normalization';
import { createHash } from 'node:crypto';

export class DomainError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function atomic(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new DomainError(`${name} must be a nonnegative safe integer.`);
  return value;
}
export function canonical(value: unknown): string {
  if(value===undefined||typeof value==='function'||typeof value==='symbol'||typeof value==='bigint'||typeof value==='number'&&!Number.isFinite(value))throw new DomainError('Digest input contains an unsupported or nonfinite value.');
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {if(![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new DomainError('Digest input must contain plain JSON objects.');return `{${Object.entries(value).sort(([a],[b]) => a<b?-1:a>b?1:0).map(([key,v])=>`${JSON.stringify(key)}:${canonical(v)}`).join(',')}}`;}
  return JSON.stringify(value);
}
export function digest(value: unknown): string { return createHash('sha256').update(canonical(value)).digest('hex'); }
export function landed(quantity: number, unitPriceMinor: number, deliveryMinor = 0, taxMinor = 0) {
  atomic(quantity,'Quantity'); atomic(unitPriceMinor,'Unit price'); atomic(deliveryMinor,'Delivery');atomic(taxMinor,'Tax');
  if (!quantity) throw new DomainError('Quantity must be positive.');
  const subtotalMinor = atomic(quantity * unitPriceMinor,'Subtotal');
  const feeMinor = Math.ceil(subtotalMinor / 100);
  return {subtotalMinor,feeMinor,deliveryMinor,totalMinor:atomic(subtotalMinor+feeMinor+deliveryMinor+taxMinor,'Total')};
}
export function assertQuote(quote: Record<string,any>, hash: string, policyVersion: number, now = Date.now()) {
  if (quote.status !== 'presented') throw new DomainError('This quote is no longer available.',409);
  if (quote.hash !== hash || digest(quote.terms) !== hash) throw new DomainError('The approved quote terms have changed.',409);
  if (quote.terms.policyVersion !== policyVersion) throw new DomainError('Your policy changed. Request a fresh quote.',409);
  if (!Number.isFinite(Date.parse(quote.expiresAt))||Date.parse(quote.expiresAt) <= now) throw new DomainError('This quote has expired or has an invalid expiry.',409);
  if(quote.terms.expiresAt&&quote.terms.expiresAt!==quote.expiresAt)throw new DomainError('Quote expiry differs from its approved terms.',409);
}
export function eligibility(supplier: Record<string,any>, intent: Record<string,any>, minimum: number, policy:{excludeNewAgents?:boolean}={}) {
  const reasons: string[]=[];
  if (normalizeItem(String(intent.item))!=='coffee beans') reasons.push('Item is outside the supplier sample catalogue');
  if (normalizeUnit(String(intent.unit))!=='kg') reasons.push('Supplier quotes require matching kilogram units');
  if(supplier.available===false) reasons.push('Supplier is currently unavailable');
  if(policy.excludeNewAgents&&supplier.isNew===true) reasons.push('New suppliers are excluded by your policy');
  if(intent.quantity<(supplier.minimumOrderQuantity||1)) reasons.push('Below the supplier minimum order quantity');
  if (supplier.credibility < minimum) reasons.push('Below your credibility threshold');
  if (supplier.stock < intent.quantity) reasons.push('Insufficient stock');
  if (normalizeCity(supplier.location) !== normalizeCity(intent.location)) reasons.push('Outside delivery area');
  if (Date.now()+supplier.leadDays*86400000 > Date.parse(intent.deadline)) reasons.push('Delivery deadline cannot be met');
  if (landed(intent.quantity,supplier.unitPriceMinor,supplier.deliveryMinor).totalMinor > intent.budgetMinor) reasons.push('Above your landed budget');
  for(const criterion of intent.hardCriteria||[]){if(!['same_city','deadline','no_substitution'].includes(criterion))reasons.push('Unverified mandatory criterion: '+criterion);}return {eligible:reasons.length===0,reasons};
}
