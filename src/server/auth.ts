import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { db } from './store';
import { DomainError } from '../domain/procurement';
export function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
export function verifyPassword(password:string,stored:string){const [salt,hash]=stored.split(':');const actual=scryptSync(password,salt,64);return hash?.length===128&&timingSafeEqual(actual,Buffer.from(hash,'hex'));}
export function sessionToken(token:string){return createHash('sha256').update(token).digest('hex');}
export type SessionActor={id:string;name:string;email:string;business_id:string;sessionId:string;role:'owner'|'member'};
export function actor(request:Request):SessionActor{const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('perenna_session='))?.slice(16);if(!token)throw new DomainError('Sign in to your business workspace.',401);const user=db().prepare("SELECT users.id,users.name,users.email,COALESCE(session_business.business_id,users.business_id) AS business_id,sessions.token AS sessionId,business_memberships.role FROM sessions JOIN users ON users.id=sessions.user_id LEFT JOIN session_business ON session_business.token=sessions.token JOIN business_memberships ON business_memberships.user_id=users.id AND business_memberships.business_id=COALESCE(session_business.business_id,users.business_id) AND business_memberships.status='active' WHERE sessions.token=? AND sessions.expires>?").get(sessionToken(token),Date.now()) as SessionActor|undefined;if(!user)throw new DomainError('Your session or business membership is no longer active. Sign in again.',401);return user;}
export function assertMembership(user:SessionActor){const membership=db().prepare("SELECT role FROM business_memberships WHERE business_id=? AND user_id=? AND status='active'").get(user.business_id,user.id) as {role:'owner'|'member'}|undefined;if(!membership)throw new DomainError('Business membership is no longer active.',403);return membership;}
export function assertOwner(user:SessionActor){if(assertMembership(user).role!=='owner')throw new DomainError('An active business owner must authorize this operation.',403);}
export function newSession(userId:string){const user=db().prepare('SELECT business_id FROM users WHERE id=?').get(userId) as {business_id:string}|undefined;if(!user)throw new DomainError('User account does not exist.',401);
 // Legacy default associations come from trusted stored users, never from a request body. Revocations are retained.
 db().prepare("INSERT OR IGNORE INTO business_memberships VALUES(?,?,'owner','active',?)").run(user.business_id,userId,new Date().toISOString());
 const membership=db().prepare("SELECT business_id FROM business_memberships WHERE user_id=? AND status='active' ORDER BY CASE WHEN business_id=? THEN 0 ELSE 1 END,business_id LIMIT 1").get(userId,user.business_id) as {business_id:string}|undefined;if(!membership)throw new DomainError('No active business membership remains.',403);
 const token=randomBytes(32).toString('hex'),hash=sessionToken(token);db().prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,userId,Date.now()+86400000);db().prepare('INSERT INTO session_business VALUES(?,?)').run(hash,membership.business_id);return token;}
export function selectBusiness(user:SessionActor,businessId:string){const membership=db().prepare("SELECT role FROM business_memberships WHERE user_id=? AND business_id=? AND status='active'").get(user.id,businessId);if(!membership)throw new DomainError('You are not an active member of this business.',403);db().prepare('INSERT INTO session_business VALUES(?,?) ON CONFLICT(token) DO UPDATE SET business_id=excluded.business_id').run(user.sessionId,businessId);return {businessId};}
export function resolveApplicationOrigin(request:Request):string{
 const target=new URL(request.url),origin=request.headers.get('origin');if(!origin)return target.origin;
 let source:URL;try{source=new URL(origin);}catch{throw new DomainError('Invalid request origin.',403);}
 if(source.username||source.password||source.pathname!=='/'||source.search||source.hash||!['http:','https:'].includes(source.protocol))throw new DomainError('Invalid request origin.',403);
 const loopback=new Set(['localhost','127.0.0.1','[::1]']);
 const localAlias=loopback.has(source.hostname)&&loopback.has(target.hostname)&&source.protocol===target.protocol&&source.port===target.port;
 if(source.origin!==target.origin&&!localAlias)throw new DomainError('Cross-origin writes are not permitted.',403);
 return source.origin;
}
export function assertOrigin(request:Request){resolveApplicationOrigin(request);}
