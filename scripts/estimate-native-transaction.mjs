import * as HieroProto from '@hiero-ledger/proto';
export function selectEffectiveExchangeRate(rates,nowMs=Date.now()){
 const valid=rate=>Number.isSafeInteger(rate?.cent_equivalent)&&rate.cent_equivalent>0&&Number.isSafeInteger(rate?.hbar_equivalent)&&rate.hbar_equivalent>0&&Number.isSafeInteger(rate?.expiration_time)&&rate.expiration_time>0;
 const current=rates?.current_rate,next=rates?.next_rate;if(!valid(current)||!Number.isFinite(nowMs)||nowMs<0)throw new Error('The current network exchange-rate interval is invalid.');
 if(current.expiration_time*1000>nowMs)return {rate:current,source:'current_rate'};
 if(valid(next)&&next.expiration_time>current.expiration_time&&next.expiration_time*1000>nowMs)return {rate:next,source:'next_rate',effectiveFrom:current.expiration_time};
 throw new Error('Both announced exchange-rate intervals are expired or invalid.');
}
export async function estimateUnsignedNativeFee(transaction,publicKeys){
 if(!transaction.isFrozen()||publicKeys.length!==2)throw new Error('A frozen unsigned two-key account creation is required for fee estimation.');
 const list=HieroProto.proto.TransactionList.decode(transaction.toBytes());if(list.transactionList.length!==1)throw new Error('A single fixed-node transaction is required.');const tx=list.transactionList[0];const signed=HieroProto.proto.SignedTransaction.decode(tx.signedTransactionBytes);const body=HieroProto.proto.TransactionBody.decode(signed.bodyBytes);if(body.highVolume)throw new Error('High-volume pricing is outside the approved scope.');
 signed.sigMap={sigPair:publicKeys.map(key=>({pubKeyPrefix:key.toBytesRaw(),ECDSASecp256k1:new Uint8Array(64)}))};tx.signedTransactionBytes=HieroProto.proto.SignedTransaction.encode(signed).finish();
 const response=await fetch('https://testnet.mirrornode.hedera.com/api/v1/network/fees?mode=STATE',{method:'POST',headers:{'Content-Type':'application/protobuf'},body:HieroProto.proto.Transaction.encode(tx).finish(),redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('The exact read-only network fee estimate is unavailable.');const estimate=await response.json();
 const rateResponse=await fetch('https://testnet.mirrornode.hedera.com/api/v1/network/exchangerate',{redirect:'error',signal:AbortSignal.timeout(15000)});if(!rateResponse.ok)throw new Error('The network exchange rate is unavailable.');const rates=await rateResponse.json();const effective=selectEffectiveExchangeRate(rates);const rate=effective.rate;
 if(!Number.isSafeInteger(estimate.total)||estimate.total<=0||!Number.isSafeInteger(rate?.cent_equivalent)||rate.cent_equivalent<=0||!Number.isSafeInteger(rate?.hbar_equivalent)||rate.hbar_equivalent<=0||rate.expiration_time*1000<=Date.now())throw new Error('The fee estimate or current exchange rate is not authoritative.');
 const amount=(BigInt(estimate.total)*BigInt(rate.hbar_equivalent)+BigInt(rate.cent_equivalent)-1n)/BigInt(rate.cent_equivalent);
 return {estimatedNetworkFeeTinybar:amount.toString(),requiredWith25PercentMarginTinybar:((amount*125n+99n)/100n).toString(),totalTinycents:String(estimate.total),source:'https://testnet.mirrornode.hedera.com/api/v1/network/fees',mode:'STATE',exchangeRate:rate,exchangeRateSource:effective.source,exchangeRateEffectiveFrom:effective.effectiveFrom??null,notes:estimate.notes??[],signatureCount:2,signaturesInvalidated:true,signed:false,submitted:false};
}
