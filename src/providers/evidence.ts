import { keccak256, stringToHex, verifyMessage, type Address, type Hex } from "viem";
import { z } from "zod";
import { ProviderError } from "./config";

export const attestationSchema=z.object({version:z.literal(1),domain:z.literal("perenna.attestation.testnet"),businessId:z.string().min(1),orderId:z.string().min(1),subjectId:z.string().min(1),issuer:z.string().regex(/^0x[0-9a-fA-F]{40}$/),role:z.enum(["buyer","supplier","reviewer"]),outcome:z.enum(["received","fulfilled","late","disputed","cancelled"]),evidenceHash:z.string().regex(/^0x[0-9a-fA-F]{64}$/),simulated:z.boolean(),issuedAt:z.number().int(),expiresAt:z.number().int(),nonce:z.string().min(16)}).strict();
export type Attestation=z.infer<typeof attestationSchema>;
export function attestationMessage(input:Attestation){const claim=attestationSchema.parse(input);return JSON.stringify(Object.fromEntries(Object.entries(claim).sort(([a],[b])=>a.localeCompare(b))));}
export function attestationDigest(input:Attestation){return keccak256(stringToHex(attestationMessage(input)));}
export async function verifyAttestation(input:Attestation,signature:Hex,authority:{signer:Address;businessId:string;orderId:string;role:Attestation["role"];revoked:boolean;nonceUsed:boolean}){
 const claim=attestationSchema.parse(input);
 if(authority.revoked||authority.nonceUsed||claim.issuer.toLowerCase()!==authority.signer.toLowerCase()||claim.businessId!==authority.businessId||claim.orderId!==authority.orderId||claim.role!==authority.role||claim.expiresAt<=Date.now()||claim.issuedAt>Date.now()+30_000||claim.issuedAt>=claim.expiresAt)throw new ProviderError("Evidence","Attestation authority, nonce or validity does not match.","INVALID_ATTESTATION");
 try{return await verifyMessage({address:authority.signer,message:attestationMessage(claim),signature});}catch{return false;}
}
