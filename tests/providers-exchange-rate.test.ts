import {describe,expect,it} from 'vitest';
import {selectEffectiveExchangeRate} from '../scripts/estimate-native-transaction.mjs';
const current={cent_equivalent:202778,hbar_equivalent:30000,expiration_time:1793930400},next={cent_equivalent:205807,hbar_equivalent:30000,expiration_time:1793934000};
describe('announced Hedera exchange-rate rollover',()=>{
 it('uses current before expiration and does not use a not-yet-effective next rate',()=>{expect(selectEffectiveExchangeRate({current_rate:current,next_rate:next},1793930399999)).toMatchObject({source:'current_rate',rate:current});});
 it('uses announced next rate at and after current expiry while next interval remains valid',()=>{for(const now of [1793930400000,1793930440000])expect(selectEffectiveExchangeRate({current_rate:current,next_rate:next},now)).toMatchObject({source:'next_rate',rate:next,effectiveFrom:1793930400});});
 it('fails closed for stale next rate, malformed rates and invalid ordering',()=>{expect(()=>selectEffectiveExchangeRate({current_rate:current,next_rate:next},1793934000000)).toThrow('expired');expect(()=>selectEffectiveExchangeRate({current_rate:current,next_rate:{...next,cent_equivalent:0}},1793930440000)).toThrow();expect(()=>selectEffectiveExchangeRate({current_rate:current,next_rate:{...next,expiration_time:current.expiration_time}},1793930440000)).toThrow();});
});
