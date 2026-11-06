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
 migrateParticipation(connection);
 return connection;
}
export function migrateParticipation(sql:DatabaseSync){
 sql.exec(`CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS business_memberships(business_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),role TEXT NOT NULL CHECK(role IN ('owner','member')),status TEXT NOT NULL CHECK(status IN ('active','revoked')),created_at TEXT NOT NULL,PRIMARY KEY(business_id,user_id));
 CREATE TABLE IF NOT EXISTS session_business(token TEXT PRIMARY KEY REFERENCES sessions(token) ON DELETE CASCADE,business_id TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS invitations(id TEXT PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,business_id TEXT NOT NULL,created_by TEXT NOT NULL,recipient_email TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('member','supplier')),role TEXT NOT NULL,intent_id TEXT,supplier_id TEXT,status TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at TEXT NOT NULL,accepted_by TEXT,accepted_business_id TEXT,request_version INTEGER);
 CREATE TABLE IF NOT EXISTS intent_participants(id TEXT PRIMARY KEY,buyer_business_id TEXT NOT NULL,intent_id TEXT NOT NULL,supplier_id TEXT NOT NULL,supplier_business_id TEXT NOT NULL,status TEXT NOT NULL,invitation_id TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL,UNIQUE(intent_id,supplier_id));
 CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY,buyer_business_id TEXT NOT NULL,intent_id TEXT NOT NULL,supplier_id TEXT,visibility TEXT NOT NULL CHECK(visibility IN ('group','private')),created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS room_memberships(room_id TEXT NOT NULL REFERENCES rooms(id),business_id TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('buyer','supplier')),status TEXT NOT NULL CHECK(status IN ('active','revoked')),participant_id TEXT,PRIMARY KEY(room_id,business_id));
 CREATE TABLE IF NOT EXISTS room_messages(sequence INTEGER PRIMARY KEY AUTOINCREMENT,message_id TEXT UNIQUE NOT NULL,room_id TEXT NOT NULL,buyer_business_id TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS room_messages_cursor ON room_messages(room_id,sequence);
 CREATE TABLE IF NOT EXISTS room_events(event_sequence INTEGER NOT NULL,room_id TEXT NOT NULL,PRIMARY KEY(event_sequence,room_id));
 CREATE INDEX IF NOT EXISTS room_events_cursor ON room_events(room_id,event_sequence);`);
 if(sql.prepare('SELECT version FROM schema_migrations WHERE version=1').get()){migrateInvitationVersion(sql);return;}
 sql.exec('BEGIN IMMEDIATE');try{
  sql.prepare("INSERT OR IGNORE INTO business_memberships SELECT business_id,id,'owner','active',? FROM users").run(new Date().toISOString());
  sql.exec("INSERT OR IGNORE INTO room_messages(message_id,room_id,buyer_business_id) SELECT id,json_extract(body,'$.roomId'),tenant FROM records WHERE kind='message' AND json_valid(body) AND json_extract(body,'$.roomId') IS NOT NULL ORDER BY created,id");
  sql.exec("INSERT OR IGNORE INTO room_events SELECT seq,COALESCE(json_extract(body,'$.roomId'),CASE WHEN json_extract(body,'$.type')='quote.revised' THEN (SELECT json_extract(records.body,'$.roomId') FROM records WHERE records.id=json_extract(events.body,'$.quoteId') AND records.kind='quote') END,CASE WHEN json_extract(body,'$.type') LIKE 'private.%' AND json_extract(body,'$.supplierId') IS NOT NULL THEN json_extract(body,'$.intentId')||'-'||json_extract(body,'$.supplierId') ELSE json_extract(body,'$.intentId')||'-group' END) FROM events WHERE json_valid(body) AND (json_extract(body,'$.roomId') IS NOT NULL OR json_extract(body,'$.intentId') IS NOT NULL)");
  sql.prepare('INSERT INTO schema_migrations VALUES(1,?)').run(new Date().toISOString());sql.exec('COMMIT');
 }catch(error){sql.exec('ROLLBACK');throw error;}
 migrateInvitationVersion(sql);
}
function migrateInvitationVersion(sql:DatabaseSync){
 if(sql.prepare('SELECT version FROM schema_migrations WHERE version=2').get())return;
 sql.exec('BEGIN IMMEDIATE');try{if(!(sql.prepare('PRAGMA table_info(invitations)').all() as {name:string}[]).some(column=>column.name==='request_version'))sql.exec('ALTER TABLE invitations ADD COLUMN request_version INTEGER');sql.exec("UPDATE invitations SET status='revoked' WHERE kind='supplier' AND status='pending' AND request_version IS NULL");sql.prepare('INSERT INTO schema_migrations VALUES(2,?)').run(new Date().toISOString());sql.exec('COMMIT');}catch(error){sql.exec('ROLLBACK');throw error;}
}
export function transaction<T>(fn:()=>T):T { const sql=db(); sql.exec('BEGIN IMMEDIATE');try{const result=fn();sql.exec('COMMIT');return result;}catch(error){sql.exec('ROLLBACK');throw error;} }
export function put(kind:string,tenant:string,value:Record<string,any>): Record<string,any> & {id:string;createdAt:string} {const record:Record<string,any> & {id:string;createdAt:string}={...value,id:value.id||randomUUID(),createdAt:value.createdAt||new Date().toISOString()}; const mutation=db().prepare('INSERT INTO records VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body WHERE records.tenant=excluded.tenant AND records.kind=excluded.kind').run(record.id,kind,tenant,JSON.stringify(record),record.createdAt);if(Number(mutation.changes)!==1)throw new DomainError('Record identity is already allocated to another scope.',409);if(kind==='message'&&typeof record.roomId==='string')db().prepare('INSERT OR IGNORE INTO room_messages(message_id,room_id,buyer_business_id) VALUES(?,?,?)').run(record.id,record.roomId,tenant);return record;}
export function get(kind:string,tenant:string,id:string):Record<string,any>|undefined {const row=db().prepare('SELECT body FROM records WHERE id=? AND tenant=? AND kind=?').get(id,tenant,kind) as {body:string}|undefined;return row?JSON.parse(row.body):undefined;}
export function list(kind:string,tenant:string):Record<string,any>[] {return (db().prepare('SELECT body FROM records WHERE tenant=? AND kind=? ORDER BY created DESC').all(tenant,kind) as {body:string}[]).map(row=>JSON.parse(row.body));}
export function allInternal(kind:string):Record<string,any>[] {return (db().prepare('SELECT body FROM records WHERE kind=?').all(kind) as {body:string}[]).map(row=>JSON.parse(row.body));}
export function event(tenant:string,type:string,text:string,extra:Record<string,any>={}) {const body={id:randomUUID(),type,text,...extra,createdAt:new Date().toISOString()};db().prepare('INSERT INTO events(id,tenant,body,created) VALUES(?,?,?,?)').run(body.id,tenant,JSON.stringify(body),body.createdAt);const roomId=extra.roomId||(extra.intentId?extra.intentId+(type.startsWith('private.')&&extra.supplierId?'-'+extra.supplierId:'-group'):undefined);if(roomId)db().prepare('INSERT OR IGNORE INTO room_events(event_sequence,room_id) SELECT seq,? FROM events WHERE id=?').run(roomId,body.id);return body;}
export function events(tenant:string,after=0){return (db().prepare('SELECT seq,body FROM events WHERE tenant=? AND seq>? ORDER BY seq LIMIT 200').all(tenant,after) as {seq:number,body:string}[]).map(row=>({...JSON.parse(row.body),sequence:row.seq}));}
