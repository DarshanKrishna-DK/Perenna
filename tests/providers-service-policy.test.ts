import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { privateKeyToAccount } from "viem/accounts";
import { seedBusiness } from "../src/server/service";
import { put } from "../src/server/store";
import { authorizeOperatingPolicy, operatingPolicyMessage, protectedServiceResult, reserveServicePurchase, revokeOperatingPolicy, type OperatingPolicy } from "../src/server/service-payments";

describe("signed operating-policy service purchases",()=>{
 const signer=privateKeyToAccount(`0x${"66".repeat(32)}`);
 const tenant="test-service-policy-"+randomUUID();
 const intentId=randomUUID();
 let policy:OperatingPolicy;
 beforeAll(async()=>{
  process.env.PERENNA_DB_PATH=":memory:";
  process.env.HEDERA_SERVICE_POLICY_SIGNER=signer.address;
  process.env.HEDERA_MAX_TOTAL_TINYBAR="1000";
  process.env.HEDERA_CAPACITY_PRICE_TINYBAR="100";
  process.env.HEDERA_OPERATING_ACCOUNT_ID="0.0.5678";
  seedBusiness(tenant,"Fixture business");
  put("intent",tenant,{id:intentId,quantity:50,location:"Mumbai",status:"ready",version:1,expiresAt:new Date(Date.now()+60000).toISOString()});
  policy={domain:"perenna.operating-policy.testnet.v1",id:randomUUID(),tenant,version:1,payer:"0.0.5678",merchant:"0.0.1234",network:"hedera:testnet",asset:"0.0.0",resourceBaseUrl:"http://localhost:3000/api/services/capacity/",purpose:"supplier-capacity-assessment",perCallCapAtomic:"100",totalCapAtomic:"200",maxNetworkFeeAtomic:"0",maxTransactionFeeAtomic:"100",networkFeePayer:"facilitator",facilitator:"https://x402.org/facilitator",expiresAt:Date.now()+60000};
  await authorizeOperatingPolicy(tenant,policy,await signer.signMessage({message:operatingPolicyMessage(policy)}));
 });
 it("reserves once, binds idempotency and withholds the paid assessment",()=>{
  const input={requestId:"service-call-one",supplierId:"sup-mango",intentId,amountAtomic:"100"};
  const first=reserveServicePurchase(tenant,policy.id,input);
  expect(reserveServicePurchase(tenant,policy.id,input).id).toBe(first.id);
  expect(()=>reserveServicePurchase(tenant,policy.id,{...input,supplierId:"sup-banyan"})).toThrow("idempotency");
  expect(()=>protectedServiceResult(tenant,first.id)).toThrow("Payment is required");
  expect(()=>protectedServiceResult("unrelated",first.id)).toThrow();
 });
 it("counts in-flight reservations and rejects policy or price changes",()=>{
  reserveServicePurchase(tenant,policy.id,{requestId:"service-call-two",supplierId:"sup-mango",intentId,amountAtomic:"100"});
  expect(()=>reserveServicePurchase(tenant,policy.id,{requestId:"service-call-three",supplierId:"sup-mango",intentId,amountAtomic:"100"})).toThrow("cumulative");
  expect(()=>reserveServicePurchase(tenant,policy.id,{requestId:"changed-price",supplierId:"sup-mango",intentId,amountAtomic:"1"})).toThrow("merchant price");
  revokeOperatingPolicy(tenant,policy.id);
  expect(()=>reserveServicePurchase(tenant,policy.id,{requestId:"after-revocation",supplierId:"sup-mango",intentId,amountAtomic:"100"})).toThrow("revoked");
 });
 it("rejects signatures made by an unrelated account",async()=>{
  const other=privateKeyToAccount(`0x${"77".repeat(32)}`);
  const next={...policy,id:randomUUID()};
  await expect(authorizeOperatingPolicy(tenant,next,await other.signMessage({message:operatingPolicyMessage(next)}))).rejects.toThrow("invalid");
 });
});

