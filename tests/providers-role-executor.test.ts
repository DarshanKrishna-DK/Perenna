import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {AccountCreateTransaction,Hbar,PrivateKey,TransactionId} from '@hiero-ledger/sdk';
import {freezeFixedRoleTransaction} from '../scripts/execute-hedera-roles.mjs';
import {reserveHederaBudget,reconcileFailedNativeCreation} from '../scripts/hedera-live-budget.mjs';
afterEach(()=>vi.unstubAllGlobals());
describe('fixed native role creation signing admission',()=>{
 it('freezes one knownID with retry/regeneration disabled and authenticates durable serialized hash before any send',async()=>{
  const key=PrivateKey.generateECDSA(),payer=PrivateKey.generateECDSA();const id=TransactionId.generate('0.0.6886052');const tx=freezeFixedRoleTransaction(new AccountCreateTransaction().setECDSAKeyWithAlias(key.publicKey).setInitialBalance(Hbar.fromTinybars(10000000)).setMaxTransactionFee(Hbar.fromTinybars(10000000)),id,null);
  expect(tx.transactionId?.toString()).toBe(id.toString());expect(tx.regenerateTransactionId).toBe(false);expect(tx.maxAttempts).toBe(1);await tx.sign(key);await tx.sign(payer);const raw=tx.toBytes(),hash='0x'+Buffer.from(await tx.getTransactionHash()).toString('hex');const path=resolve('.data/native-budget-test-'+randomUUID()+'.json');
  await reserveHederaBudget({id:'role-fixture',kind:'role_account_creation',payerAccountId:'0.0.6886052',transactionFormat:'hedera',principalTinybar:'10000000',maximumNetworkFeeTinybar:'10000000',signedTransactionHex:'0x'+Buffer.from(raw).toString('hex'),transactionHash:hash,details:{sdkTransactionId:id.toString()}},path);
  const saved=JSON.parse(readFileSync(path,'utf8')).operations[0];expect(saved.status).toBe('signed');expect(saved.nativeTransactionId).toMatch(/^0\.0\.6886052-\d+-\d+$/);expect(saved.transactionHash).toBe(hash);expect(saved.budgetCommitmentTinybar).toBe('20000000');
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({transactions:[{transaction_id:saved.nativeTransactionId,transaction_hash:Buffer.from(hash.slice(2),'hex').toString('base64'),consensus_timestamp:'200.1',nonce:0,result:'INSUFFICIENT_TX_FEE',charged_tx_fee:295890,entity_id:null}]})));
  const failed=await reconcileFailedNativeCreation('role-fixture','INSUFFICIENT_TX_FEE',path);expect(failed).toMatchObject({status:'consensus_failed',actualNetworkFeeTinybar:'295890',unspentPrincipalReleasedTinybar:'10000000',resubmissionAuthorized:false});expect(JSON.parse(readFileSync(path,'utf8')).operations[0]).toMatchObject({status:'reverted',principalTinybar:'10000000',budgetCommitmentTinybar:'295890'});
 });
});
