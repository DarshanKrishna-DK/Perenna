import { afterEach, describe, expect, it } from "vitest";
import { validatePayment } from "../src/providers/hedera";
import { negotiateSuppliers } from "../src/providers/inference";
import type { PaymentRequirements } from "@x402/core/types";

describe("provider authority",()=>{
 const policy = {payee:"0.0.1234",asset:"0.0.0",maxAmount:"100",expiresAt:Date.now()+100_000,resourceUrl:"http://localhost:3000/api/service",policyVersion:"1"};
 const requirement:PaymentRequirements = {scheme:"exact",network:"hedera:testnet",asset:"0.0.0",amount:"100",payTo:"0.0.1234",maxTimeoutSeconds:60,extra:{feePayer:"0.0.999"}};
 afterEach(()=>{delete process.env.INFERENCE_ENABLED;delete process.env.INFERENCE_MAX_CALLS;});
 it("rejects changed payee, mainnet, and oversized or expired payments",()=>{
  expect(()=>validatePayment(requirement,policy)).not.toThrow();
  for(const changed of [{payTo:"0.0.2345"},{network:"hedera:mainnet" as const},{amount:"101"},{amount:"-1"}]) expect(()=>validatePayment({...requirement,...changed},policy)).toThrow();
  expect(()=>validatePayment(requirement,{...policy,expiresAt:0})).toThrow();
 });
 it("does not invoke inference without explicit usage authority",async()=>{
  await expect(negotiateSuppliers({},[{id:"one"}])).rejects.toThrow("paused");
  process.env.INFERENCE_ENABLED="true";process.env.INFERENCE_MAX_CALLS="3";
  await expect(negotiateSuppliers({},[{id:"one"}])).rejects.toThrow("durable");
 });
});
