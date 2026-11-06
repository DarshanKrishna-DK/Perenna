import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { attestationMessage, verifyAttestation, type Attestation } from "../src/providers/evidence";

describe("role-specific signed evidence",()=>{
 it("accepts only exact current claims from the authorized business role",async()=>{
  const issuer=privateKeyToAccount(`0x${"44".repeat(32)}`);
  const claim:Attestation={version:1,domain:"perenna.attestation.testnet",businessId:"buyer-one",orderId:"order-one",subjectId:"supplier-one",issuer:issuer.address,role:"buyer",outcome:"received",evidenceHash:`0x${"ab".repeat(32)}`,simulated:true,issuedAt:Date.now()-1000,expiresAt:Date.now()+60_000,nonce:"single-use-nonce-one"};
  const signature=await issuer.signMessage({message:attestationMessage(claim)});
  const authority={signer:issuer.address,businessId:claim.businessId,orderId:claim.orderId,role:"buyer" as const,revoked:false,nonceUsed:false};
  expect(await verifyAttestation(claim,signature,authority)).toBe(true);
  expect(await verifyAttestation({...claim,outcome:"fulfilled"},signature,authority)).toBe(false);
  await expect(verifyAttestation(claim,signature,{...authority,revoked:true})).rejects.toThrow();
  await expect(verifyAttestation(claim,signature,{...authority,nonceUsed:true})).rejects.toThrow();
  await expect(verifyAttestation(claim,signature,{...authority,businessId:"unrelated"})).rejects.toThrow();
  await expect(verifyAttestation({...claim,role:"supplier"},signature,authority)).rejects.toThrow();
  await expect(verifyAttestation({...claim,expiresAt:Date.now()-1},signature,authority)).rejects.toThrow();
 });
});
