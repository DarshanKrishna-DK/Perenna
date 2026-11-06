import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import solc from 'solc';
import {createPublicClient,defineChain,http,isAddress,keccak256,formatUnits,toHex} from 'viem';

const buyer=process.argv[2];
if(!buyer||!isAddress(buyer))throw new Error('Pass the public buyer EVM address as the first argument. No private key is required.');
const source=readFileSync(resolve('contracts/StandingProcurementAgreement.sol'),'utf8');
const input={language:'Solidity',sources:{'Agreement.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
const compiled=JSON.parse(solc.compile(JSON.stringify(input)));
const errors=(compiled.errors??[]).filter(error=>error.severity==='error');
if(errors.length)throw new Error('Agreement compilation failed. Inspect the compiler diagnostics locally.');
const contract=compiled.contracts['Agreement.sol'].StandingProcurementAgreement;
const data=`0x${contract.evm.bytecode.object}`;
const network=defineChain({id:296,name:'Hedera testnet',nativeCurrency:{name:'HBAR',symbol:'HBAR',decimals:18},rpcUrls:{default:{http:['https://testnet.hashio.io/api']}},testnet:true});
const rpc=createPublicClient({chain:network,transport:http(process.env.HEDERA_EVM_RPC_URL?.trim()||network.rpcUrls.default.http[0],{retryCount:0,timeout:20_000})});
const record={preparedAt:new Date().toISOString(),compiler:solc.version(),evmVersion:'paris',chainId:296,buyer,bytecodeHash:keccak256(data),runtimeCodeHash:keccak256(`0x${contract.evm.deployedBytecode.object}`),abi:contract.abi,unsignedTransaction:{from:buyer,data,value:'0x0',chainId:'0x128'},signed:false,submitted:false,limitation:'Unsigned deployment preparation only. It grants no deployment, funding, or spending authority.'};
try{
 if(await rpc.getChainId()!==296)throw new Error('NETWORK_MISMATCH');
 const [estimatedGas,gasPrice,block]=await Promise.all([rpc.estimateGas({account:buyer,data,value:0n}),rpc.getGasPrice(),rpc.getBlock()]);
 const gasCeiling=(estimatedGas*125n+99n)/100n;
 if(gasCeiling>block.gasLimit/2n)throw new Error('GAS_LIMIT_BOUND');
 const maxFeeWei=gasCeiling*gasPrice;
 Object.assign(record,{estimation:'succeeded',estimatedGas:estimatedGas.toString(),gasCeiling:gasCeiling.toString(),gasPriceWei:gasPrice.toString(),maxFeeWei:maxFeeWei.toString(),maxFeeHBAR:formatUnits(maxFeeWei,18),unsignedTransaction:{...record.unsignedTransaction,gas:toHex(gasCeiling),gasPrice:toHex(gasPrice)}});
}catch(error){
 Object.assign(record,{estimation:'failed',errorType:error instanceof Error?error.name:'UnknownError',nextAction:'Do not sign. Check the selected testnet address, RPC access, balance and supported deployment bytecode, then repeat this read-only preparation.'});
}
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/spa-deployment-preparation.json',JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({preparedAt:record.preparedAt,chainId:record.chainId,buyer,compiler:record.compiler,bytecodeHash:record.bytecodeHash,runtimeCodeHash:record.runtimeCodeHash,estimation:record.estimation,estimatedGas:record.estimatedGas,maxFeeHBAR:record.maxFeeHBAR,signed:false,submitted:false,artifact:'artifacts/spa-deployment-preparation.json'},null,2));
