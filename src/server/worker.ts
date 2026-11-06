import { runNextJob } from './jobs';
import { runStandingSchedule } from './scheduler';
let stopping=false;
process.on('SIGINT',()=>{stopping=true;});
process.on('SIGTERM',()=>{stopping=true;});
async function main(){while(!stopping){await runNextJob();await runStandingSchedule();await new Promise(resolve=>setTimeout(resolve,1000));}}
main().catch(()=>{console.error('Worker stopped after a storage or configuration failure.');process.exitCode=1;});
