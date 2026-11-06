import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DomainError } from '../domain/procurement';

let connection: DatabaseSync | undefined;
export function db() {
 if(connection) return connection;
 const path=process.env.PERENNA_DB_PATH || resolve('.data/perenna.sqlite');
 if(path!==':memory:') mkdirSync(dirname(path),{recursive:true});
 connection=new DatabaseSync(path);
 connection.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,business_id TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,tenant TEXT NOT NULL,body TEXT NOT NULL,created TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS records_scope ON records(tenant,kind);
 CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,tenant TEXT NOT NULL,body TEXT NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS dedupe(tenant TEXT NOT NULL,key TEXT NOT NULL,value TEXT NOT NULL,PRIMARY KEY(tenant,key));`);
 return connection;
}
export function transaction<T>(fn:()=>T):T { const sql=db(); sql.exec('BEGIN IMMEDIATE');try{const result=fn();sql.exec('COMMIT');return result;}catch(error){sql.exec('ROLLBACK');throw error;} }
export function put(kind:string,tenant:string,value:Record<string,any>): Record<string,any> & {id:string;createdAt:string} {const record={...value,id:value.id||randomUUID(),createdAt:value.createdAt||new Date().toISOString()}; const mutation=db().prepare('INSERT INTO records VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body WHERE records.tenant=excluded.tenant AND records.kind=excluded.kind').run(record.id,kind,tenant,JSON.stringify(record),record.createdAt);if(Number(mutation.changes)!==1)throw new DomainError('Record identity is already allocated to another scope.',409);return record;}
export function get(kind:string,tenant:string,id:string):Record<string,any>|undefined {const row=db().prepare('SELECT body FROM records WHERE id=? AND tenant=? AND kind=?').get(id,tenant,kind) as {body:string}|undefined;return row?JSON.parse(row.body):undefined;}
export function list(kind:string,tenant:string):Record<string,any>[] {return (db().prepare('SELECT body FROM records WHERE tenant=? AND kind=? ORDER BY created DESC').all(tenant,kind) as {body:string}[]).map(row=>JSON.parse(row.body));}
export function allInternal(kind:string):Record<string,any>[] {return (db().prepare('SELECT body FROM records WHERE kind=?').all(kind) as {body:string}[]).map(row=>JSON.parse(row.body));}
export function event(tenant:string,type:string,text:string,extra:Record<string,any>={}) {const body={id:randomUUID(),type,text,...extra,createdAt:new Date().toISOString()};db().prepare('INSERT INTO events(id,tenant,body,created) VALUES(?,?,?,?)').run(body.id,tenant,JSON.stringify(body),body.createdAt);return body;}
export function events(tenant:string,after=0){return (db().prepare('SELECT seq,body FROM events WHERE tenant=? AND seq>? ORDER BY seq LIMIT 200').all(tenant,after) as {seq:number,body:string}[]).map(row=>({...JSON.parse(row.body),sequence:row.seq}));}
