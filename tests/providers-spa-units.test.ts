import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {decodeFunctionData,keccak256,type Hex} from 'viem';
const rpc=vi.hoisted(()=>({getChainId:vi.fn(),getCode:vi.fn(),readContract:vi.fn()}));
vi.mock('viem',async(importOriginal)=>({...await importOriginal<any>(),createPublicClient:()=>rpc}));
import {prepareCreateAgreement,prepareExecuteAgreement,readAgreement,spaAbi} from '../src/providers/spa';
const id=('0x'+'11'.repeat(32)) as Hex,terms=('0x'+'22'.repeat(32)) as Hex,order=('0x'+'33'.repeat(32)) as Hex;
const buyer='0x1111111111111111111111111111111111111111',supplier='0x2222222222222222222222222222222222222222',executor='0x3333333333333333333333333333333333333333';
beforeEach(()=>{vi.stubEnv('HEDERA_SPA_CONTRACT','0x4444444444444444444444444444444444444444');vi.stubEnv('HEDERA_SPA_RUNTIME_CODE_HASH',keccak256('0x6000'));rpc.getChainId.mockResolvedValue(296);rpc.getCode.mockResolvedValue('0x6000');rpc.readContract.mockResolvedValue([buyer,supplier,executor,terms,0n,BigInt(Math.floor(Date.now()/1000)+600),300n,500n,0n,500n,0n,0n,7n,true,false,false]);});
afterEach(()=>vi.unstubAllEnvs());
describe('Hedera tinybar contract and weibar relay boundaries',()=>{
 it('leaves ABI caps in tinybars and scales only funding transaction.value',()=>{
  const prepared=prepareCreateAgreement({id,supplier,executor,termsHash:terms,start:0,expiry:2000000000,perOrderTinybars:'300',aggregateTinybars:'500',fundTinybars:'500',cadence:60});
  const decoded=decodeFunctionData({abi:spaAbi,data:prepared.data});expect(decoded.functionName).toBe('create');expect(decoded.args![6]).toBe(300n);expect(decoded.args![7]).toBe(500n);expect(prepared.value).toBe(500n*10n**10n);expect(prepared.chainId).toBe(296);
 });
 it('reads tinybar balances unchanged and executes tinybar ABI amount without relay scaling',async()=>{
  const state=await readAgreement(id);expect(state.balance).toBe(500n);expect(state.perOrder).toBe(300n);
  const prepared=await prepareExecuteAgreement({id,orderDigest:order,termsHash:terms,amountTinybars:'300',executor});const decoded=decodeFunctionData({abi:spaAbi,data:prepared.data});expect(decoded.functionName).toBe('execute');expect(decoded.args![3]).toBe(300n);expect(decoded.args![4]).toBe(7n);expect(prepared.value).toBe(0n);
  await expect(prepareExecuteAgreement({id,orderDigest:order,termsHash:terms,amountTinybars:'301',executor})).rejects.toMatchObject({code:'SPA_BLOCKED'});
 });
});
