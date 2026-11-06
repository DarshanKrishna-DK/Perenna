import {describe,expect,it} from 'vitest';
import {keccak256} from 'viem';
import {validateSpaRuntime} from '../src/providers/spa';
describe('agreement runtime authority',()=>{it('requires exact reviewed deployed bytecode hash',()=>{expect(()=>validateSpaRuntime(undefined,undefined)).toThrow('No agreement');expect(()=>validateSpaRuntime('0x',keccak256('0x'))).toThrow('No agreement');expect(()=>validateSpaRuntime('0x6000',undefined)).toThrow('runtime hash');expect(()=>validateSpaRuntime('0x6000',keccak256('0x6001'))).toThrow('does not match');expect(()=>validateSpaRuntime('0x6000',keccak256('0x6000'))).not.toThrow();});});
