import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { db } from './store';
import { DomainError } from '../domain/procurement';
export function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
export function verifyPassword(password:string,stored:string){const [salt,hash]=stored.split(':');const actual=scryptSync(password,salt,64);return hash?.length===128&&timingSafeEqual(actual,Buffer.from(hash,'hex'));}
export function sessionToken(token:string){return createHash('sha256').update(token).digest('hex');}
export function actor(request:Request){const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('perenna_session='))?.slice(16);if(!token)throw new DomainError('Sign in to your business workspace.',401);const user=db().prepare('SELECT users.id,users.name,users.email,users.business_id,sessions.token AS sessionId FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(sessionToken(token),Date.now()) as {id:string,name:string,email:string,business_id:string,sessionId:string}|undefined;if(!user)throw new DomainError('Your session expired. Sign in again.',401);return user;}
export function newSession(userId:string){const token=randomBytes(32).toString('hex');db().prepare('INSERT INTO sessions VALUES(?,?,?)').run(sessionToken(token),userId,Date.now()+86400000);return token;}
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
