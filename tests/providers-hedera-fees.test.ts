import {describe,expect,it} from 'vitest';
import {AccountId,Hbar,TransactionId,TransferTransaction} from '@hiero-ledger/sdk';
import {inspectPaymentNetworkFees} from '../src/providers/hedera';
const requirements:any={scheme:'exact',network:'hedera:testnet',asset:'0.0.0',amount:'100',payTo:'0.0.2',maxTimeoutSeconds:60,extra:{feePayer:'0.0.99'}};
const policy:any={payer:'0.0.1',payee:'0.0.2',maxNetworkFeeAtomic:'0',maxTransactionFeeAtomic:'200000000',networkFeePayer:'facilitator',facilitator:'https://x402.org/facilitator'};
function payload(payer='0.0.99',fee=100000000){const transfer=new TransferTransaction().addHbarTransfer('0.0.1',Hbar.fromTinybars(-100)).addHbarTransfer('0.0.2',Hbar.fromTinybars(100)).setNodeAccountIds([AccountId.fromString('0.0.3')]).setTransactionId(TransactionId.generate(payer)).setMaxTransactionFee(Hbar.fromTinybars(fee)).freeze();return {payload:{transaction:Buffer.from(transfer.toBytes()).toString('base64')}} as any;}
describe('separate facilitator and user network fee bounds',()=>{
 it('permits zero user fee when an independent facilitator pays a bounded transaction fee',()=>{expect(inspectPaymentNetworkFees(payload(),requirements,policy)).toMatchObject({feePayerAccountId:'0.0.99',userMaximumChargeAtomic:'0',transactionMaximumFeeAtomic:'100000000'});});
 it('rejects changed transaction fee payer, oversized transaction maximum and missing frozen bounds',()=>{expect(()=>inspectPaymentNetworkFees(payload('0.0.88'),requirements,policy)).toThrow('differs');expect(()=>inspectPaymentNetworkFees(payload('0.0.99',300000000),requirements,policy)).toThrow('differs');expect(()=>inspectPaymentNetworkFees(payload(),requirements,{...policy,maxTransactionFeeAtomic:undefined})).toThrow('Freeze');expect(()=>inspectPaymentNetworkFees(payload(),{...requirements,extra:{feePayer:'0.0.1'}},policy)).toThrow('separate');});
});
