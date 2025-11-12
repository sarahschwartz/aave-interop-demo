import { ETH_ADDRESS } from "@dutterbutter/zksync-sdk/core";
import { zksyncOSTestnet } from "./wagmi";
import {
  type Abi,
  type Address,
  type EIP1193Provider,
  encodeFunctionData,
  Hash,
  type Hex,
} from "viem";
import { UseAccountReturnType, Config } from "wagmi";
import { type ViemClient, type ViemSdk } from "@dutterbutter/zksync-sdk/viem";
import L2_INTEROP_CENTER_JSON from "@/utils/abis/L2InteropCenter.json";
import I_WRAPPED_TOKEN_JSON from "@/utils/abis/IWrappedTokenGatewayV3.json";
import L1_INTEROP_HANDLER_JSON from "@/utils/abis/L1InteropHandler.json";
import type { DepositRow, HashItem } from "./types";
import { sepolia } from "viem/chains";

type ShadowAccountOp = {
  target: Address;
  value: bigint;
  data: Hex;
};

const deployedL2InteropCenter: `0x${string}` =
  "0xc64315efbdcD90B71B0687E37ea741DE0E6cEFac";
const deployedL1InteropHandler: `0x${string}` =
  "0xB0dD4151fdcCaAC990F473533C15BcF8CE10b1de";
const aaveWeth: `0x${string}` = "0x387d311e47e80b498169e6fb51d3193167d89F7D";
const aavePool: `0x${string}` = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

export async function getShadowAccount(
  client: ViemClient,
  account: UseAccountReturnType<Config>
) {
  const shadowAccount = await client.l2.readContract({
    address: deployedL2InteropCenter,
    abi: L2_INTEROP_CENTER_JSON.abi as Abi,
    functionName: "l1ShadowAccount",
    args: [account.address],
  });
  return shadowAccount as `0x${string}`;
}

export async function getBundle(shadowAccount: `0x${string}`, amount: bigint) {
  const depositData = encodeFunctionData({
    abi: I_WRAPPED_TOKEN_JSON.abi as Abi,
    functionName: "depositETH",
    args: [aavePool, shadowAccount, 0],
  });

  const ops: ShadowAccountOp[] = [
    {
      target: aaveWeth,
      value: amount,
      data: depositData,
    },
  ];

  return {
    address: deployedL2InteropCenter,
    abi: L2_INTEROP_CENTER_JSON.abi as Abi,
    functionName: "sendBundleToL1",
    args: [ops],
  };
}

export async function initWithdraw(
  account: UseAccountReturnType<Config>,
  amount: bigint,
  sdk: ViemSdk,
  shadowAccount: `0x${string}`
) {
  try {
    await checkChainId(account);

    const params = {
      token: ETH_ADDRESS,
      amount,
      to: shadowAccount as `0x${string}`,
    } as const;

    console.log("creating withdraw txn...");
    const created = await sdk.withdrawals.create(params);

    const hash = created.l2TxHash;
    if (!hash) {
      console.log("ERROR: no hash");
      return;
    }
    console.log("withdraw created:", hash);

    const response = await fetch("/api/start-withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hash,
      }),
    });

    const json = await response.json();
    if (!json.ok) {
      throw new Error("error sending txn for finalization");
    }

    return hash;
  } catch (e) {
    alert("something went wrong");
    console.log("ERROR:", e);
    return;
  }
}

export async function getFinalizeBundleParams(
  bundleHash: `0x${string}`,
  client: ViemClient
) {
  const proof = await client.zks.getL2ToL1LogProof(bundleHash, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rcpt = (await client.zks.getReceiptWithL2ToL1(bundleHash)) as any;
  const logs = rcpt?.l2ToL1Logs;
  if (!logs) {
    console.log("missing l2tol1logs");
    return;
  }
  const log = logs[0];
  const sender = rcpt.to;
  if (!sender) {
    console.log("missing sender");
    return;
  }

  const params = {
    chainId: zksyncOSTestnet.id,
    l2BatchNumber: proof.batchNumber,
    l2MessageIndex: proof.id,
    l2Sender: sender,
    l2TxNumberInBatch: log.tx_number_in_block,
    merkleProof: proof.proof,
    message: "0x" + rcpt.logs[0].data.slice(130),
  };

  return {
    address: deployedL1InteropHandler,
    abi: L1_INTEROP_HANDLER_JSON.abi as Abi,
    functionName: "receiveInteropFromL2",
    args: [params],
    chain: sepolia,
  };
}

export async function estimateGas(
  account: UseAccountReturnType<Config>,
  amount: bigint,
  sdk: ViemSdk
) {
  try {
    await checkChainId(account);

    const params = {
      token: ETH_ADDRESS,
      amount,
      to: account.address,
    } as const;
    const quote = await sdk.withdrawals.quote(params);
    console.log("WITHDRAW QUOTE →", quote);
    return quote;
  } catch (e) {
    alert("something went wrong");
    console.log("ERROR:", e);
    return;
  }
}

export async function checkChainId(
  account: UseAccountReturnType<Config>,
  chainId: 8022833 | 11155111 = zksyncOSTestnet.id
) {
  if (!account || !account.connector || !account.connector.getProvider) {
    throw new Error("no account found, try reconnecting");
  }
  const provider = (await account.connector.getProvider()) as
    | EIP1193Provider
    | undefined;
  if (!provider) {
    throw new Error("no provider, try reconnecting");
  }
  const currentHex = await provider.request({ method: "eth_chainId" });
  if (typeof currentHex === "string") {
    const parsed = Number.parseInt(currentHex, 16);
    if (Number.isFinite(parsed) && parsed !== chainId) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    }
  }
}

export function storeHashes(
  withdrawHash: `0x${string}`,
  bundleHash: `0x${string}`,
  accountAddress: `0x${string}`
): void {
  const key = `latestAaveZKsyncDeposits-${accountAddress}`;

  const stored = localStorage.getItem(key);
  let hashes: string[] = [];

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        hashes = parsed;
      }
    } catch {
      hashes = [];
    }
  }

  // hashes will be removed from local storage once bundle is executed
  // (withdraw hash):(is withdraw finalized):(bundle hash)
  hashes.push(`${withdrawHash}:false:${bundleHash}`);

  localStorage.setItem(key, JSON.stringify(hashes));
}

export async function getAaveDepositSummary(
  sdk: ViemSdk,
  address: `0x${string}`,
  items: HashItem[],
  client: ViemClient
) {
  const [txs, phases] = await Promise.all([
    Promise.allSettled(
      items.map((i) => client.l2.getTransaction({ hash: i.hash }))
    ),
    Promise.allSettled(items.map((i) => sdk.withdrawals.status(i.hash))),
  ]);

  const rows: DepositRow[] = items.map((item, i) => {
    const txR = txs[i];
    const stR = phases[i];

    const valueWei =
      txR.status === "fulfilled" && txR.value
        ? txR.value.value ?? BigInt(0)
        : BigInt(0);
    const phase = stR.status === "fulfilled" ? stR.value.phase : "PENDING";

    const isFinalized = phase === "FINALIZED";

    if (!item.isFinalized && isFinalized) {
      item.isFinalized = true;
    }

    return {
      hash: item.hash,
      valueWei,
      phase,
      bundleHash: item.bundleHash,
    };
  });

  const updatedStorage = JSON.stringify(
    items.map((i: HashItem) => `${i.hash}:${i.isFinalized}:${i.bundleHash}`)
  );
  const key = `latestAaveZKsyncDeposits-${address}`;
  localStorage.setItem(key, updatedStorage);

  const totalWei = rows.reduce((acc, r) => acc + r.valueWei, BigInt(0));
  const anyFinalizing = rows.filter((r) => r.phase !== "FINALIZED");

  return { totalWei, rows, anyFinalizing };
}

export function getHashes(address: `0x${string}`): HashItem[] | undefined {
  const key = `latestAaveZKsyncDeposits-${address}`;
  const rawLocalStorageValue = localStorage.getItem(key);
  if (!rawLocalStorageValue) return;
  const parsed = JSON.parse(rawLocalStorageValue) as string[];

  const items = parsed.map((item) => {
    const [hash, finalizedFlag, bundleHash] = item.split(":");
    return {
      hash: hash as Hash,
      isFinalized: finalizedFlag === "true",
      bundleHash: bundleHash as Hash,
    };
  });

  return items;
}

export function updateStoredHashes(
  address: `0x${string}`,
  executedBundles: `0x${string}`[]
) {
  const hashes = getHashes(address);
  if (!hashes) return;
  const key = `latestAaveZKsyncDeposits-${address}`;
  const updatedStorage = JSON.stringify(
    hashes
      .filter((i: HashItem) => !executedBundles.includes(i.bundleHash))
      .map((i: HashItem) => `${i.hash}:${i.isFinalized}:${i.bundleHash}`)
  );
  localStorage.setItem(key, updatedStorage);
}
