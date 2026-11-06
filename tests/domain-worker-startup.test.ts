import {expect,it} from 'vitest';
import {spawnSync} from 'node:child_process';
import {existsSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

it('initializes and exits the real worker startup check without executing jobs, loading private configuration or reaching the network',()=>{
 const path=resolve('.data','worker-startup-check-'+randomUUID()+'.sqlite');
 try{
  const result=spawnSync(process.execPath,['--import','tsx','--input-type=module','--eval',"globalThis.fetch=async()=>{throw new Error('Network forbidden in startup check');};process.argv.push('--check');await import('./src/server/worker.ts');"],{cwd:process.cwd(),encoding:'utf8',timeout:30000,env:{NODE_ENV:'test',SystemRoot:process.env.SystemRoot,USERPROFILE:process.env.USERPROFILE,USERNAME:process.env.USERNAME,USERDOMAIN:process.env.USERDOMAIN,HOMEDRIVE:process.env.HOMEDRIVE,HOMEPATH:process.env.HOMEPATH,PATH:process.env.PATH,TEMP:process.env.TEMP,TMP:process.env.TMP,PERENNA_DB_PATH:path,INFERENCE_ENABLED:'false',HEDERA_SPA_EXECUTION_ENABLED:'false',HEDERA_PAYMENTS_ENABLED:'false',ARKIV_WRITES_ENABLED:'false',SPEECH_ENABLED:'false'}});
  expect(result.error).toBeUndefined();expect(result.status,result.stderr).toBe(0);expect(JSON.parse(result.stdout.trim())).toEqual({mode:'startup_check',execution:false,sqlite:'ready',jobs:0,agreements:0});expect(existsSync(path)).toBe(true);
 }finally{for(const file of [path,path+'-wal',path+'-shm'])if(existsSync(file))unlinkSync(file);}
},40000);
