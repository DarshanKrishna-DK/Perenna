import {describe,expect,it} from 'vitest';
import {deliveryInstant,deliveryLocalParts} from '../src/domain/time';

describe('explicit delivery clock and timezone',()=>{
  it('preserves the actual Mumbai delivery instant independently from browser timezone',()=>{
    const instant=deliveryInstant('2026-11-12','17:30','Asia/Kolkata');
    expect(instant).toBe('2026-11-12T12:00:00Z');
    expect(deliveryLocalParts(instant,'Asia/Kolkata')).toEqual({date:'2026-11-12',time:'17:30'});
  });
  it('rejects ambiguous, missing and calendar-invalid local times instead of silently shifting them',()=>{
    expect(()=>deliveryInstant('2026-11-01','01:30','America/New_York')).toThrow('ambiguous');
    expect(()=>deliveryInstant('2026-03-08','02:30','America/New_York')).toThrow('ambiguous');
    expect(()=>deliveryInstant('2026-02-30','17:00','Asia/Kolkata')).toThrow();
    expect(()=>deliveryInstant('2026-11-12','17:00','invented/timezone')).toThrow();
  });
});
