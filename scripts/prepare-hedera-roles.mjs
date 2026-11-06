import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {AccountCreateTransaction,Hbar,PrivateKey,PublicKey} from '@hiero-ledger/sdk';

const buyerAccountId='0.0.6886052';
const publicPath=resolve('artifacts/hedera-role-account-plan-v2.json');
const secretPath=resolve('.data/hedera-role-account-secrets.json');
const roles=[
 {id:'operating_executor',initialBalanceTinybar:'10000000',purpose:'Separate autonomous service payer and standing-agreement executor',accountIdEnv:'HEDERA_OPERATING_ACCOUNT_ID',privateKeyEnv:'HEDERA_OPERATING_PRIVATE_KEY',keyTypeEnv:'HEDERA_OPERATING_KEY_TYPE',evmPrivateKeyEnv:'HEDERA_EVM_PRIVATE_KEY',publicAddressEnv:'HEDERA_OPERATING_EVM_ADDRESS'},
 {id:'spa_supplier',initialBalanceTinybar:'20000000',purpose:'ECDSA standing-agreement supplier signer/payee and supplier fee signer',accountIdEnv:'HEDERA_SUPPLIER_ACCOUNT_ID',privateKeyEnv:'HEDERA_SUPPLIER_PRIVATE_KEY',keyTypeEnv:'HEDERA_SUPPLIER_KEY_TYPE',publicAddressEnv:'HEDERA_SUPPLIER_SIGNER_ADDRESS'},
 {id:'platform_fee_topup',initialBalanceTinybar:'50000000',purpose:'Platform fee recipient and separately reviewed operating top-up source wallet',accountIdEnv:'HEDERA_FEE_ACCOUNT_ID',privateKeyEnv:'HEDERA_FEE_PRIVATE_KEY',keyTypeEnv:'HEDERA_FEE_KEY_TYPE',publicAddressEnv:'HEDERA_FEE_EVM_ADDRESS'},
];
const sha256=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function validate(plan,secrets){const {planHash,...body}=plan;if(planHash!==sha256(body)||plan.buyerAccountId!==buyerAccountId||plan.network!=='hedera:testnet'||plan.roles.length!==3||plan.version!==2||plan.worstCaseTotalTinybar!=='110000000')throw new Error('The immutable role plan or local key binding is invalid.');for(const role of plan.roles){const expected=roles.find(value=>value.id===role.id);if(!expected||role.initialBalanceTinybar!==expected.initialBalanceTinybar||role.maximumNetworkFeeTinybar!=='10000000')throw new Error('Role funding differs from the bounded dry-run scope.');const local=secrets.roles[role.id];if(!local)throw new Error('A role key is missing.');const key=PrivateKey.fromStringDer(local.privateKeyDer);if(key.publicKey.toStringDer()!==role.publicKeyDer||('0x'+key.publicKey.toEvmAddress()).toLowerCase()!==role.evmAddress.toLowerCase())throw new Error('A role public key does not match its saved local key.');}return plan;}
export function prepareHederaRoleAccounts(){
 if(existsSync(publicPath)){if(!existsSync(secretPath))throw new Error('The existing public plan has no local key file. Preserve it for recovery.');return validate(JSON.parse(readFileSync(publicPath,'utf8')),JSON.parse(readFileSync(secretPath,'utf8')));}
 mkdirSync(resolve('artifacts'),{recursive:true});mkdirSync(resolve('.data'),{recursive:true});
 const existing=existsSync(secretPath)?JSON.parse(readFileSync(secretPath,'utf8')):null;
 const localRoles=existing?.roles??{};const preparedRoles=roles.map(role=>{const saved=localRoles[role.id];const key=saved?PrivateKey.fromStringDer(saved.privateKeyDer):PrivateKey.generateECDSA();const evmAddress='0x'+key.publicKey.toEvmAddress();if(!saved)localRoles[role.id]={keyType:'ecdsa',privateKeyDer:key.toStringDer(),privateKeyRaw:'0x'+key.toStringRaw()};return {...role,keyType:'ecdsa',accountId:null,publicKeyDer:key.publicKey.toStringDer(),evmAddress,maximumNetworkFeeTinybar:'10000000',worstCaseTinybar:(BigInt(role.initialBalanceTinybar)+10000000n).toString()};});
 const body={version:2,createdAt:new Date().toISOString(),network:'hedera:testnet',chainId:296,buyerAccountId,roles:preparedRoles,totalInitialBalanceTinybar:'80000000',maximumTotalNetworkFeeTinybar:'30000000',worstCaseTotalTinybar:'110000000',worstCaseTotalHBAR:'1.1',signed:false,submitted:false,executionSupported:false,approvalScope:'Dry-run role account creation plan only. No client, signer, funding transfer or network submission is invoked.'};
 const plan={...body,planHash:sha256(body)};
 // Create-only local files preserve the first generated keys and their immutable public plan.
 if(!existing)writeFileSync(secretPath,JSON.stringify({version:1,planHash:plan.planHash,roles:localRoles},null,2)+'\n',{flag:'wx',mode:0o600});
 writeFileSync(publicPath,JSON.stringify(plan,null,2)+'\n',{flag:'wx',mode:0o600});
 return validate(plan,JSON.parse(readFileSync(secretPath,'utf8')));
}
export function buildUnsignedRoleTransactions(plan){
 const fee=plan.version===3?'110000000':'10000000';const total=plan.version===3?'410000000':'110000000';const {planHash,...body}=plan;if(planHash!==sha256(body)||plan.buyerAccountId!==buyerAccountId||plan.network!=='hedera:testnet'||plan.roles.length!==3||new Set(plan.roles.map(role=>role.id)).size!==3||plan.worstCaseTotalTinybar!==total)throw new Error('Only the immutable approved testnet plan may be prepared.');
 return plan.roles.map(role=>{const expected=roles.find(value=>value.id===role.id);if(!expected||role.initialBalanceTinybar!==expected.initialBalanceTinybar||role.maximumNetworkFeeTinybar!==fee)throw new Error('The role transaction exceeds its concrete preparation scope.');return {role:role.id,transaction:new AccountCreateTransaction().setECDSAKeyWithAlias(PublicKey.fromStringECDSA(role.publicKeyDer)).setInitialBalance(Hbar.fromTinybars(role.initialBalanceTinybar)).setMaxTransactionFee(Hbar.fromTinybars(role.maximumNetworkFeeTinybar))};});
}
export function prepareHederaRoleRevisionV3(){
 const original=JSON.parse(readFileSync(publicPath,'utf8'));const {planHash,...old}=original;if(planHash!=='f7ce0e717ce817a05bd51074c009a9ef543f651c4f81251c5e0c61f90c458489'||sha256(old)!==planHash)throw new Error('The approved original role plan changed.');
 const path=resolve('artifacts/hedera-role-account-plan-v3.json');if(existsSync(path)){const saved=JSON.parse(readFileSync(path,'utf8'));const {planHash,...body}=saved;if(sha256(body)!==planHash||saved.version!==3||saved.supersedesPlanHash!==original.planHash)throw new Error('The saved v3 proposal is invalid.');return saved;}
 const revisedRoles=original.roles.map(role=>({...role,...(role.id==='spa_supplier'?{accountIdEnv:'HEDERA_SPA_SUPPLIER_ACCOUNT_ID',privateKeyEnv:'HEDERA_SPA_SUPPLIER_PRIVATE_KEY',keyTypeEnv:'HEDERA_SPA_SUPPLIER_KEY_TYPE',publicAddressEnv:'HEDERA_SUPPLIER_SIGNER_ADDRESS'}:{}),maximumNetworkFeeTinybar:'110000000',worstCaseTinybar:(BigInt(role.initialBalanceTinybar)+110000000n).toString()}));
 const body={...old,version:3,createdAt:new Date().toISOString(),supersedesPlanHash:original.planHash,roles:revisedRoles,maximumTotalNetworkFeeTinybar:'330000000',worstCaseTotalTinybar:'410000000',worstCaseTotalHBAR:'4.1',nativeMerchantFeeAccountPreserved:'0.0.9823983',approvalScope:'Owner approved the same three wallets and initial balances with a maximum1.1HBAR creation fee each, inside the shared10HBAR ceiling. A separate explicit--v3 execution is required; the failed v2 transaction must be reconciled and never resent.'};const plan={...body,planHash:sha256(body)};writeFileSync(path,JSON.stringify(plan,null,2)+'\n',{flag:'wx',mode:0o600});return plan;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.slice(2).some(arg=>arg!=='--dry-run'))throw new Error('This helper supports dry-run preparation only. No execution flag is implemented.');
 const plan=prepareHederaRoleAccounts();buildUnsignedRoleTransactions(plan);
 console.log(JSON.stringify({planHash:plan.planHash,buyerAccountId:plan.buyerAccountId,network:plan.network,roles:plan.roles,worstCaseTotalHBAR:plan.worstCaseTotalHBAR,signed:false,submitted:false,publicPlanPath:publicPath,localSecretsPath:secretPath,accountIdsAvailable:false},null,2));
}

