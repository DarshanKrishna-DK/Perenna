import {describe,expect,it} from 'vitest';
import {PrivateKey} from '@hiero-ledger/sdk';
import {parseHederaPrivateKey} from '../src/providers/hedera';
describe('explicit Hedera key algorithms',()=>{
 it.each(['ecdsa','ed25519'] as const)('roundtrips generated %s raw and DER keys without algorithm inference',type=>{
  const generated=type==='ecdsa'?PrivateKey.generateECDSA():PrivateKey.generateED25519();
  const expected=generated.publicKey.toStringDer();
  expect(parseHederaPrivateKey(generated.toStringRaw(),type).publicKey.toStringDer()).toBe(expected);
  expect(parseHederaPrivateKey('0x'+generated.toStringRaw(),type).publicKey.toStringDer()).toBe(expected);
  expect(parseHederaPrivateKey(generated.toStringDer(),undefined).publicKey.toStringDer()).toBe(expected);
  expect(()=>parseHederaPrivateKey(generated.toStringRaw(),undefined,'HEDERA_OPERATING_KEY_TYPE')).toThrow('HEDERA_OPERATING_KEY_TYPE must explicitly');
  expect(()=>parseHederaPrivateKey(generated.toStringRaw(),'infer')).toThrow('must explicitly');
 });
 it('does not expose invalid private input through configuration errors',()=>{
  const invalid='private-fixture-must-never-echo';try{parseHederaPrivateKey(invalid,'ecdsa');throw new Error('Expected rejection');}catch(error){expect((error as Error).message).not.toContain(invalid);expect(error).toMatchObject({code:'INVALID_KEY_CONFIGURATION'});}
 });
 it('keeps identical raw bytes distinct under the explicitly selected algorithms',()=>{
  const raw='11'.repeat(32);expect(parseHederaPrivateKey(raw,'ecdsa').publicKey.toStringDer()).not.toBe(parseHederaPrivateKey(raw,'ed25519').publicKey.toStringDer());
 });
});
