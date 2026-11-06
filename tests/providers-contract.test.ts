import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createCustomCommon, Mainnet } from "@ethereumjs/common";
import { createLegacyTx } from "@ethereumjs/tx";
import { createAccount, createAddressFromPrivateKey, hexToBytes, type Address as VmAddress } from "@ethereumjs/util";
import { createVM, runTx } from "@ethereumjs/vm";
import { createBlock } from "@ethereumjs/block";
import { decodeFunctionResult, encodeFunctionData, keccak256, stringToHex, type Abi, type Address } from "viem";

describe("standing agreement bytecode", () => {
  it("enforces bilateral authorization, caps, nonce, pause, revocation and expiry in signed local transactions", async () => {
    const solc = (await import("solc")).default;
    const source = readFileSync("contracts/StandingProcurementAgreement.sol", "utf8");
    const output = JSON.parse(solc.compile(JSON.stringify({language:"Solidity",sources:{"Agreement.sol":{content:source}},settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:"paris",outputSelection:{"*":{"*":["abi","evm.bytecode.object"]}}}})));
    expect(output.errors?.filter((e: {severity:string})=>e.severity==="error") ?? []).toEqual([]);
    const compiled = output.contracts["Agreement.sol"].StandingProcurementAgreement;
    const abi = compiled.abi as Abi;
    const common = createCustomCommon({chainId:31337}, Mainnet, {hardfork:"cancun"});
    // EthereumJS has no Hedera relay conversion. Raw VM balance units below model contract tinybars.
    // Adapter tests independently verify the 18-decimal relay value boundary. This VM is not Hedera network proof.
    const vm = await createVM({common});
    const keys = ["11","22","33"].map(x=>hexToBytes(`0x${x.repeat(32)}`));
    const addresses = keys.map(createAddressFromPrivateKey);
    for (const address of addresses) await vm.stateManager.putAccount(address,createAccount({balance:10n**20n}));
    let timestamp = 1000n;
    async function tx(index:number,data:string,to?:VmAddress,value=0n) {
      const account = await vm.stateManager.getAccount(addresses[index]);
      const signed = createLegacyTx({nonce:account!.nonce,gasLimit:10_000_000n,gasPrice:10n,data:hexToBytes(data as `0x${string}`),to,value},{common}).sign(keys[index]);
      return runTx(vm,{tx:signed,block:createBlock({header:{gasLimit:30_000_000n,timestamp,baseFeePerGas:0n}},{common})});
    }
    const deployed = await tx(0,`0x${compiled.evm.bytecode.object}`);
    expect(deployed.execResult.exceptionError).toBeUndefined();
    const contract = deployed.createdAddress!;
    const id = keccak256(stringToHex("agreement-one"));
    const terms = keccak256(stringToHex("version-one-permitted-coffee"));
    const order = keccak256(stringToHex("order-one"));
    const call = (index:number,name:string,args:unknown[],value=0n)=>tx(index,encodeFunctionData({abi,functionName:name,args}),contract,value);
    const ok = (result:Awaited<ReturnType<typeof tx>>)=>expect(result.execResult.exceptionError).toBeUndefined();
    const blocked = (result:Awaited<ReturnType<typeof tx>>)=>expect(result.execResult.exceptionError).toBeDefined();
    ok(await call(0,"create",[id,addresses[1].toString() as Address,addresses[2].toString() as Address,terms,0n,10_000n,300n,500n,0n],500n));
    const initialState=decodeFunctionResult({abi,functionName:"agreements",data:("0x"+Buffer.from((await call(0,"agreements",[id])).execResult.returnValue).toString("hex")) as `0x${string}`}) as readonly unknown[];
    expect(initialState[6]).toBe(300n);expect(initialState[7]).toBe(500n);expect(initialState[9]).toBe(500n);
    blocked(await call(2,"execute",[id,order,terms,100n,0n]));
    blocked(await call(0,"accept",[id,terms]));
    ok(await call(1,"accept",[id,terms]));
    blocked(await call(2,"execute",[id,order,terms,301n,0n]));
    const before = (await vm.stateManager.getAccount(addresses[1]))!.balance;
    ok(await call(2,"execute",[id,order,terms,300n,0n]));
    expect((await vm.stateManager.getAccount(addresses[1]))!.balance-before).toBe(300n);
    blocked(await call(2,"execute",[id,order,terms,100n,1n]));
    blocked(await call(2,"execute",[id,keccak256(stringToHex("too-much")),terms,201n,1n]));
    ok(await call(1,"pause",[id]));
    blocked(await call(2,"execute",[id,keccak256(stringToHex("paused")),terms,100n,1n]));
    ok(await call(0,"resume",[id]));
    blocked(await call(2,"execute",[id,keccak256(stringToHex("unaccepted-resume")),terms,100n,1n]));
    ok(await call(1,"accept",[id,terms]));
    blocked(await call(2,"execute",[id,keccak256(stringToHex("bad-terms")),keccak256(stringToHex("new-price")),100n,1n]));
    timestamp = 10_001n;
    blocked(await call(2,"execute",[id,keccak256(stringToHex("expired")),terms,100n,1n]));
    ok(await call(0,"revoke",[id]));
    blocked(await call(1,"accept",[id,terms]));
    ok(await call(0,"withdraw",[id]));
    expect((await vm.stateManager.getAccount(contract))!.balance).toBe(0n);
  },30_000);
});
