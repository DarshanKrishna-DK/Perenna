import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import solc from 'solc';
import {PrivateKey,PublicKey} from '@hiero-ledger/sdk';
import {createPublicClient,defineChain,getContractAddress,http,keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {HEDERA_BUDGET_PATH,reserveHederaBudget,checkpointHederaBudget,corroborateHederaFees} from './hedera-live-budget.mjs';
class DeploymentSafetyError extends Error {}
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const buyerId='0.0.6886052';
const approvedBytecodeHash='0x857c406b8247117126870cc71ba5ae17415d3489056b27236ed6021eee456ac6';
const approvedRuntimeHash='0x0670d32069ae27c015ac89c4b75efc1311d9952aea8fe40df3dcde5e5affe0e4';
const feeCapWei=1520000000000000000n;
const operationId='spa-deployment:296:'+buyerId+':'+approvedBytecodeHash;
const network=defineChain({id:296,name:'Hedera testnet',nativeCurrency:{name:'HBAR',symbol:'HBAR',decimals:18},rpcUrls:{default:{http:['https://testnet.hashio.io/api']}},testnet:true});
const client=()=>createPublicClient({chain:network,cacheTime:0,transport:http(undefined,{retryCount:0,timeout:20000})});
export function reviewedDeploymentBytecode(){
 const artifact=JSON.parse(readFileSync(resolve(root,'artifacts/spa-deployment-preparation.json'),'utf8'));
 const source=readFileSync(resolve(root,'contracts/StandingProcurementAgreement.sol'),'utf8');
 const compiled=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'Agreement.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'paris',outputSelection:{'*':{'*':['evm.bytecode.object','evm.deployedBytecode.object']}}}})));
 if(compiled.errors?.some(error=>error.severity==='error'))throw new DeploymentSafetyError('The reviewed contract did not compile.');
 const contract=compiled.contracts['Agreement.sol'].StandingProcurementAgreement,data='0x'+contract.evm.bytecode.object,runtime='0x'+contract.evm.deployedBytecode.object;
 if(artifact.chainId!==296||artifact.evmVersion!=='paris'||artifact.compiler!==solc.version()||artifact.bytecodeHash!==approvedBytecodeHash||artifact.runtimeCodeHash!==approvedRuntimeHash||keccak256(data)!==approvedBytecodeHash||keccak256(runtime)!==approvedRuntimeHash||artifact.unsignedTransaction.data!==data)throw new DeploymentSafetyError('The source, compiler or saved deployment bytecode differs from the reviewed hashes.');
 return {data,runtimeCodeHash:approvedRuntimeHash,bytecodeHash:approvedBytecodeHash,buyerAddress:artifact.buyer};
}
export function loadApprovedBuyerKey(){
 const encoded=(process.env.HEDERA_PRIVATE_KEY||'').trim().replace(/^0x/i,'');let key;
 try{if(encoded.length===64){if(process.env.HEDERA_KEY_TYPE?.trim().toLowerCase()!=='ecdsa')throw new DeploymentSafetyError();key=PrivateKey.fromStringECDSA(encoded);}else{if(!PrivateKey.isDerKey(encoded)||PrivateKey.getAlgorithm(encoded)!=='ecdsa')throw new DeploymentSafetyError();key=PrivateKey.fromStringDer(encoded);}}catch{throw new DeploymentSafetyError('The saved buyer must have an explicitly typed valid ECDSA key.');}
 return {sdk:key,account:privateKeyToAccount('0x'+key.toStringRaw())};
}
export async function verifyApprovedBuyer(key){
 if(process.env.HEDERA_ACCOUNT_ID!==buyerId)throw new DeploymentSafetyError('Only the approved buyer account may fund this deployment.');
 const response=await fetch('https://testnet.mirrornode.hedera.com/api/v1/accounts/'+buyerId+'?transactions=false',{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new DeploymentSafetyError('The public buyer account could not be verified.');const record=await response.json();
 let matches=false;try{matches=record.account===buyerId&&record.key?._type==='ECDSA_SECP256K1'&&PublicKey.fromStringECDSA(record.key.key).toStringDer()===key.sdk.publicKey.toStringDer()&&record.evm_address.toLowerCase()===key.account.address.toLowerCase();}catch{}
 if(!matches||!Number.isSafeInteger(record.balance?.balance)||record.balance.balance<0)throw new DeploymentSafetyError('The saved private key does not match the current buyer public key and EVM address.');return BigInt(record.balance.balance);
}
async function deploymentScope(rpc,key,reviewed){
 if(await rpc.getChainId()!==296)throw new DeploymentSafetyError('Only Hedera testnet chain296 is permitted.');
 const [nonce,pending,gasPrice,balance,block]=await Promise.all([rpc.getTransactionCount({address:key.account.address,blockTag:'latest'}),rpc.getTransactionCount({address:key.account.address,blockTag:'pending'}),rpc.getGasPrice(),rpc.getBalance({address:key.account.address,blockTag:'latest'}),rpc.getBlock({blockTag:'latest'})]);
 if(nonce!==pending)throw new DeploymentSafetyError('The buyer has an unresolved pending nonce. Reconcile before deploying.');
 const estimate=await rpc.estimateGas({account:key.account.address,data:reviewed.data,value:0n,gasPrice,blockTag:'latest'});const gas=(estimate*125n+99n)/100n,maxFeeWei=gas*gasPrice;
 const nativeBalance=await verifyApprovedBuyer(key);const feeTinybar=(maxFeeWei+9999999999n)/10000000000n;
 if(estimate<=0n||gas>block.gasLimit/2n||maxFeeWei<=0n||maxFeeWei>feeCapWei||balance<maxFeeWei||nativeBalance<feeTinybar)throw new DeploymentSafetyError('The fresh deployment estimate exceeds the1.52HBAR bound, block bound or observed buyer balance.');
 return {nonce,gas,gasPrice,maxFeeWei,maximumNetworkFeeTinybar:feeTinybar.toString(),unsigned:{chainId:296,nonce,gas,gasPrice,value:0n,data:reviewed.data,type:'legacy'}};
}
async function verifyDeploymentReceipt(rpc,reservation){
 if(await rpc.getChainId()!==296)throw new DeploymentSafetyError('Only Hedera testnet chain296 is permitted.');
 const [receipt,tx]=await Promise.all([rpc.getTransactionReceipt({hash:reservation.transactionHash}),rpc.getTransaction({hash:reservation.transactionHash})]);
 if(receipt.transactionHash.toLowerCase()!==reservation.transactionHash.toLowerCase()||receipt.status!=='success')throw new DeploymentSafetyError('The original deployment receipt is not successful. Preserve the original hash.');
 const expected=reservation.details;const address=getContractAddress({from:expected.from,nonce:BigInt(expected.nonce)});
 if(receipt.contractAddress?.toLowerCase()!==address.toLowerCase()||receipt.from.toLowerCase()!==expected.from.toLowerCase()||tx.chainId!==296||tx.from.toLowerCase()!==expected.from.toLowerCase()||tx.to!==null||tx.input.toLowerCase()!==expected.data.toLowerCase()||tx.value!==0n||tx.nonce!==expected.nonce||tx.gas!==BigInt(expected.gas)||tx.gasPrice!==BigInt(expected.gasPrice))throw new DeploymentSafetyError('The mined transaction differs from the frozen signed deployment.');
 const [block,code]=await Promise.all([rpc.getBlock({blockNumber:receipt.blockNumber}),rpc.getCode({address,blockTag:'latest'})]);if(block.hash!==receipt.blockHash||!code||code==='0x'||keccak256(code)!==approvedRuntimeHash)throw new DeploymentSafetyError('The canonical receipt or deployed runtime hash does not match the reviewed contract.');
 checkpointHederaBudget(operationId,'receipt_confirmed',{contractAddress:address,receiptBlock:receipt.blockNumber.toString(),runtimeCodeHash:approvedRuntimeHash});
 let feeProofStatus='unknown_retained_maximum';try{const observed=await corroborateHederaFees(operationId);feeProofStatus=observed.feeProofStatus;}catch{}
 const result={network:'hedera:testnet',chainId:296,buyerAccountId:buyerId,transactionHash:reservation.transactionHash,contractAddress:address,bytecodeHash:approvedBytecodeHash,runtimeCodeHash:approvedRuntimeHash,receiptStatus:'success',runtimeVerified:true,feeProofStatus,maximumReservedNetworkFeeTinybar:reservation.maximumNetworkFeeTinybar,explorerUrl:'https://hashscan.io/testnet/transaction/'+reservation.transactionHash};
 const path=resolve(root,'artifacts/spa-deployment-result-'+reservation.transactionHash.slice(2,10)+'.json');mkdirSync(dirname(path),{recursive:true});if(!existsSync(path))writeFileSync(path,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});return result;
}
export async function runSpaDeployment({execute=false,reconcile=false}={}){
 const reviewed=reviewedDeploymentBytecode();const rpc=client();
 if(reconcile){const ledger=JSON.parse(readFileSync(HEDERA_BUDGET_PATH,'utf8'));const original=ledger.operations.find(value=>value.id===operationId);if(!original)throw new DeploymentSafetyError('There is no original signed deployment to reconcile.');return verifyDeploymentReceipt(rpc,original);}
 if(existsSync(HEDERA_BUDGET_PATH)){const ledger=JSON.parse(readFileSync(HEDERA_BUDGET_PATH,'utf8'));if(ledger.operations.some(value=>value.id===operationId))throw new DeploymentSafetyError('The deployment already has a durable hash. Use--reconcile without signing or resending.');}
 const key=loadApprovedBuyerKey();if(key.account.address.toLowerCase()!==reviewed.buyerAddress.toLowerCase())throw new DeploymentSafetyError('The saved key address differs from the reviewed deployment buyer.');
 const scope=await deploymentScope(rpc,key,reviewed);
 if(!execute)return {signed:false,submitted:false,chainId:296,buyerAccountId:buyerId,buyerAddress:key.account.address,bytecodeHash:approvedBytecodeHash,runtimeCodeHash:approvedRuntimeHash,gas:scope.gas.toString(),gasPriceWei:scope.gasPrice.toString(),maximumNetworkFeeTinybar:scope.maximumNetworkFeeTinybar,maximumAuthorizedDeploymentFeeTinybar:'152000000',nextAction:'Root may execute this reviewed scope with--execute. This dry run grants no role-account creation authority.'};
 const fresh=await deploymentScope(rpc,key,reviewed);if(fresh.nonce!==scope.nonce||fresh.gasPrice!==scope.gasPrice)throw new DeploymentSafetyError('The nonce or gas price changed. No signature was admitted.');
 const raw=await key.account.signTransaction(fresh.unsigned);const transactionHash=keccak256(raw);
 const reserved=await reserveHederaBudget({id:operationId,kind:'spa_deployment',payerAccountId:buyerId,transactionFormat:'evm',principalTinybar:'0',maximumNetworkFeeTinybar:fresh.maximumNetworkFeeTinybar,signedTransactionHex:raw,transactionHash,details:{from:key.account.address,chainId:296,nonce:fresh.nonce,gas:fresh.gas.toString(),gasPrice:fresh.gasPrice.toString(),data:reviewed.data,bytecodeHash:approvedBytecodeHash,runtimeCodeHash:approvedRuntimeHash}});
 try{const returned=await rpc.sendRawTransaction({serializedTransaction:raw});if(returned.toLowerCase()!==transactionHash.toLowerCase())throw new DeploymentSafetyError('The provider returned an unexpected hash.');checkpointHederaBudget(operationId,'submitted');await rpc.waitForTransactionReceipt({hash:transactionHash,timeout:60000});return await verifyDeploymentReceipt(rpc,reserved);}catch{checkpointHederaBudget(operationId,'unknown');throw new DeploymentSafetyError('Deployment outcome is not fully verified. Reconcile the durable original hash; do not execute or resend again.');}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const args=process.argv.slice(2);if(args.some(value=>!['--execute','--reconcile'].includes(value))||args.includes('--execute')&&args.includes('--reconcile'))throw new DeploymentSafetyError('Choose read-only preparation, --execute, or --reconcile.');runSpaDeployment({execute:args.includes('--execute'),reconcile:args.includes('--reconcile')}).then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error instanceof DeploymentSafetyError?error.message:'Deployment preparation failed. Preserve the shared journal and inspect sanitized local configuration.');process.exitCode=1;});}
