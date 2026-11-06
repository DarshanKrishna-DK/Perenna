import { createPublicClient, createWalletClient, defineChain, encodeFunctionData, http, isAddress, keccak256, parseAbi, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ProviderError, requireEnabled, secret } from "./config";

export const spaAbi = parseAbi([
  "function create(bytes32 id,address supplier,address executor,bytes32 termsHash,uint256 start,uint256 expiry,uint256 perOrder,uint256 aggregate,uint256 cadence) payable",
  "function accept(bytes32 id,bytes32 termsHash)",
  "function execute(bytes32 id,bytes32 orderDigest,bytes32 termsHash,uint256 amount,uint256 nonce)",
  "function pause(bytes32 id)", "function resume(bytes32 id)", "function revoke(bytes32 id)", "function withdraw(bytes32 id)",
  "function agreements(bytes32) view returns(address buyer,address supplier,address executor,bytes32 termsHash,uint256 start,uint256 expiry,uint256 perOrder,uint256 aggregate,uint256 spent,uint256 balance,uint256 cadence,uint256 lastOrder,uint256 nonce,bool accepted,bool paused,bool revoked)",
  "event Paid(bytes32 indexed id,bytes32 indexed orderDigest,uint256 amount,uint256 nonce)",
]);
const network = defineChain({id:296,name:"Hedera testnet",nativeCurrency:{name:"HBAR",symbol:"HBAR",decimals:18},rpcUrls:{default:{http:["https://testnet.hashio.io/api"]}},testnet:true});
// Hedera contract values and ABI monetary arguments are tinybars. Only relay transaction.value uses weibars.
const TINYBAR_TO_RELAY_WEIBAR = 10_000_000_000n;
function client() { return createPublicClient({chain:network,transport:http(process.env.HEDERA_EVM_RPC_URL || network.rpcUrls.default.http[0])}); }
function contract(): Address { const address=secret("Hedera SPA","HEDERA_SPA_CONTRACT"); if(!isAddress(address))throw new ProviderError("Hedera SPA","The agreement contract address is invalid."); return address; }
export function validateSpaRuntime(code:Hex|undefined,expected:string|undefined){
 if(!code||code==="0x")throw new ProviderError("Hedera SPA","No agreement contract exists at this address.","CONTRACT_MISSING");
 if(!expected||!/^0x[a-fA-F0-9]{64}$/.test(expected))throw new ProviderError("Hedera SPA","Configure the compiled agreement runtime hash before preparing or verifying transactions.","CONTRACT_HASH_REQUIRED");
 if(keccak256(code).toLowerCase()!==expected.toLowerCase())throw new ProviderError("Hedera SPA","Agreement runtime bytecode does not match the reviewed contract.","CONTRACT_MISMATCH");
}
async function checkedClient(){const rpc=client();if(await rpc.getChainId()!==296)throw new ProviderError("Hedera SPA","Only Hedera testnet chain 296 is permitted.","NETWORK_MISMATCH");validateSpaRuntime(await rpc.getCode({address:contract()}),process.env.HEDERA_SPA_RUNTIME_CODE_HASH);return rpc;}
export async function assertSpaContract(){await checkedClient();}

export async function readAgreement(id:Hex){const rpc=await checkedClient();const row=await rpc.readContract({address:contract(),abi:spaAbi,functionName:"agreements",args:[id]});return {buyer:row[0],supplier:row[1],executor:row[2],termsHash:row[3],start:row[4],expiry:row[5],perOrder:row[6],aggregate:row[7],spent:row[8],balance:row[9],cadence:row[10],lastOrder:row[11],nonce:row[12],accepted:row[13],paused:row[14],revoked:row[15]};}
export function prepareCreateAgreement(input:{id:Hex;supplier:Address;executor:Address;termsHash:Hex;start:number;expiry:number;perOrderTinybars:string;aggregateTinybars:string;fundTinybars:string;cadence:number}){
 const amounts=[input.perOrderTinybars,input.aggregateTinybars,input.fundTinybars];if(amounts.some(x=>!/^\d+$/.test(x)||BigInt(x)<=0n))throw new ProviderError("Hedera SPA","Agreement amounts must be positive atomic HBAR amounts.","INVALID_AMOUNT");
 const data=encodeFunctionData({abi:spaAbi,functionName:"create",args:[input.id,input.supplier,input.executor,input.termsHash,BigInt(input.start),BigInt(input.expiry),BigInt(input.perOrderTinybars),BigInt(input.aggregateTinybars),BigInt(input.cadence)]});
 return {to:contract(),data,value:BigInt(input.fundTinybars)*TINYBAR_TO_RELAY_WEIBAR,chainId:296};
}
export function prepareAcceptAgreement(id:Hex,termsHash:Hex){return {to:contract(),data:encodeFunctionData({abi:spaAbi,functionName:"accept",args:[id,termsHash]}),value:0n,chainId:296};}
export function prepareAgreementControl(id:Hex,action:"pause"|"revoke"|"resume"|"withdraw"){
 return {to:contract(),data:encodeFunctionData({abi:spaAbi,functionName:action,args:[id]}),value:0n,chainId:296};
}
export async function verifySpaTransaction(hash:Hex,expected:{from:Address;data:Hex;value:bigint}){
 const rpc=await checkedClient();
 try{
  const [receipt,transaction]=await Promise.all([rpc.getTransactionReceipt({hash}),rpc.getTransaction({hash})]);
  const matches=transaction.to?.toLowerCase()===contract().toLowerCase()&&transaction.from.toLowerCase()===expected.from.toLowerCase()&&transaction.input===expected.data&&transaction.value===expected.value;
  return {confirmed:receipt.status==="success"&&matches,termsVerified:matches,transactionHash:hash,blockNumber:receipt.blockNumber.toString()};
 }catch{throw new ProviderError("Hedera SPA","The submitted agreement transaction has not been confirmed.","OUTCOME_UNKNOWN");}
}
export async function prepareExecuteAgreement(input:{id:Hex;orderDigest:Hex;termsHash:Hex;amountTinybars:string;executor:Address}){
 if(!/^\d+$/.test(input.amountTinybars))throw new ProviderError("Hedera SPA","Invalid atomic amount.","INVALID_AMOUNT");
 const state=await readAgreement(input.id);const now=BigInt(Math.floor(Date.now()/1000));const amount=BigInt(input.amountTinybars);
 if(state.executor.toLowerCase()!==input.executor.toLowerCase()||!state.accepted||state.paused||state.revoked||state.termsHash!==input.termsHash||state.start>now||state.expiry<=now||amount<=0n||amount>state.perOrder||amount>state.balance||state.spent+amount>state.aggregate||state.lastOrder>0n&&now<state.lastOrder+state.cadence)throw new ProviderError("Hedera SPA","Standing agreement authority, terms or limits do not permit this order.","SPA_BLOCKED");
 return {to:contract(),data:encodeFunctionData({abi:spaAbi,functionName:"execute",args:[input.id,input.orderDigest,input.termsHash,amount,state.nonce]}),value:0n,chainId:296,nonce:state.nonce};
}
export async function submitSpaExecution(input:{id:Hex;orderDigest:Hex;termsHash:Hex;amountTinybars:string;maxGasWei:bigint;onSubmitted:(hash:Hex)=>Promise<void>}){
 requireEnabled("Hedera SPA","HEDERA_SPA_EXECUTION_ENABLED");
 const account=privateKeyToAccount(secret("Hedera SPA","HEDERA_EVM_PRIVATE_KEY") as Hex);
 const prepared=await prepareExecuteAgreement({...input,executor:account.address});const rpc=await checkedClient();
 const gas=await rpc.estimateGas({account,to:prepared.to,data:prepared.data,value:0n});const gasPrice=await rpc.getGasPrice();
 if(input.maxGasWei<=0n||gas*gasPrice>input.maxGasWei)throw new ProviderError("Hedera SPA","The execution fee exceeds its authorized cap.","BUDGET_EXCEEDED");
 const wallet=createWalletClient({account,chain:network,transport:http(process.env.HEDERA_EVM_RPC_URL||network.rpcUrls.default.http[0])});
 const request=await wallet.prepareTransactionRequest({account,to:prepared.to,data:prepared.data,value:0n,gas,gasPrice});
 const serializedTransaction=await wallet.signTransaction(request);
 const hash=keccak256(serializedTransaction);
 await input.onSubmitted(hash);
 try{await rpc.sendRawTransaction({serializedTransaction});const receipt=await rpc.waitForTransactionReceipt({hash,timeout:60_000});return {transactionHash:hash,confirmed:receipt.status==="success",blockNumber:receipt.blockNumber.toString(),explorerUrl:`https://hashscan.io/testnet/transaction/${hash}`};}
 catch{throw new ProviderError("Hedera SPA","Execution was submitted but remains uncertain. Reconcile the recorded hash before retrying.","OUTCOME_UNKNOWN");}
}

