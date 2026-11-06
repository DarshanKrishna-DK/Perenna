import { runNextJob } from './jobs';
import { runStandingSchedule } from './scheduler';
import {db} from './store';
let stopping=false;
process.on('SIGINT',()=>{stopping=true;});
process.on('SIGTERM',()=>{stopping=true;});
async function main(){
 if(process.argv.includes('--check')){
  const sql=db();const count=(kind:string)=>Number((sql.prepare('SELECT COUNT(*) AS n FROM records WHERE kind=?').get(kind) as {n:number}).n);
  console.log(JSON.stringify({mode:'startup_check',execution:false,sqlite:'ready',jobs:count('job'),agreements:count('agreement')}));return;
 }
 while(!stopping){await runNextJob();await runStandingSchedule();await new Promise(resolve=>setTimeout(resolve,1000));}
}
main().catch(()=>{console.error('Worker stopped after a storage or configuration failure.');process.exitCode=1;});
