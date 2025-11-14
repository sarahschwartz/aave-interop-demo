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
import type { HashItem } from "./types";

type ShadowAccountOp = {
  target: Address;
  value: bigint;
  data: Hex;
};

const deployedL2InteropCenter: `0x${string}` =
  "0xc64315efbdcD90B71B0687E37ea741DE0E6cEFac";
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

    return hash;
  } catch (e) {
    alert("something went wrong");
    console.log("ERROR:", e);
    return;
  }
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

  // hashes will be removed from local storage once withdraw is finalized and bundle is executed
  // (withdraw hash)::(bundle hash)
  hashes.push(`${withdrawHash}:${bundleHash}`);

  localStorage.setItem(key, JSON.stringify(hashes));
}

export async function sendHashesForFinalization(
  wHash: `0x${string}`,
  bHash: `0x${string}`
) {
  const response = await fetch("/api/start-withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      withdrawHash: wHash,
      bundleHash: bHash,
    }),
  });

  const json = await response.json();
  if (!json.ok) {
    throw new Error("error sending txns for finalization");
  }
}

export async function getAaveDepositSummary(
  sdk: ViemSdk,
  address: `0x${string}`,
  items: HashItem[],
  client: ViemClient
) {
  const storageKey = `latestAaveZKsyncDeposits-${address}`;

  if (!items.length) {
    return {
      totalWeiFinalizing: BigInt(0),
      countFinalizing: 0,
    };
  }

  const statusResults = await Promise.allSettled(
    items.map((i) => sdk.withdrawals.status(i.withdrawHash))
  );

  const stillFinalizing: HashItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const s = statusResults[i];
    const isFinalized =
      s.status === "fulfilled" && s.value?.phase === "FINALIZED";

    if (!isFinalized) {
      stillFinalizing.push(items[i]);
    }
  }

  const updated = stillFinalizing.map(
    (i) => `${i.withdrawHash}:${i.bundleHash}`
  );
  localStorage.setItem(storageKey, JSON.stringify(updated));

  if (stillFinalizing.length === 0) {
    return {
      totalWeiFinalizing: BigInt(0),
      countFinalizing: 0,
    };
  }

  const txResults = await Promise.allSettled(
    stillFinalizing.map((item) =>
      client.l2.getTransaction({ hash: item.withdrawHash })
    )
  );

  let totalWeiFinalizing = BigInt(0);

  for (const tx of txResults) {
    if (tx.status === "fulfilled" && tx.value) {
      const raw = tx.value.value ?? BigInt(0);
      totalWeiFinalizing += raw;
    }
  }

  return {
    totalWeiFinalizing,
    countFinalizing: stillFinalizing.length,
  };
}

export function getHashes(address: `0x${string}`): HashItem[] | undefined {
  const key = `latestAaveZKsyncDeposits-${address}`;
  const rawLocalStorageValue = localStorage.getItem(key);
  if (!rawLocalStorageValue) return;
  const parsed = JSON.parse(rawLocalStorageValue) as string[];

  const items = parsed.map((item) => {
    const [withdrawHash, bundleHash] = item.split(":");
    return {
      withdrawHash: withdrawHash as Hash,
      bundleHash: bundleHash as Hash,
    };
  });

  return items;
}
