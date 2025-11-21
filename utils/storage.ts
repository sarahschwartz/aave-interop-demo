import type { ViemSdk, ViemClient } from "@dutterbutter/zksync-sdk/viem";
import type { HashItem, ShadowAccountOp } from "./types";
import type { Hash, Hex } from "@dutterbutter/zksync-sdk";
import { decodeFunctionData } from "viem";
import { CONTRACT_ADDRESSES } from "./constants";
import I_POOL_JSON from "@/utils/abis/IPool.json";
import L2_INTEROP_CENTER_JSON from "@/utils/abis/L2InteropCenter.json";

const depositsKeyBase = "latestAaveZKsyncDeposits-";
const borrowsKeyBase = "latestAaveZKsyncBorrows-";

export function getHashes(address: `0x${string}`): {
  deposits: HashItem[] | undefined;
  borrows: HashItem[] | undefined;
} {
  const depositsKey = `${depositsKeyBase}${address}`;
  const borrowsKey = `${borrowsKeyBase}${address}`;
  const rawDepositsValue = localStorage.getItem(depositsKey);
  const rawBorrowsValue = localStorage.getItem(borrowsKey);

  let deposits;
  let borrows;

  if (rawDepositsValue) {
    deposits = getParsedData(rawDepositsValue);
  }

  if (rawBorrowsValue) {
    borrows = getParsedData(rawBorrowsValue);
  }

  return { deposits, borrows };
}

function getParsedData(rawValue: string) {
  const parsed = JSON.parse(rawValue) as string[];

  const items = parsed.map((item) => {
    const [withdrawHash, bundleHash] = item.split(":");
    return {
      withdrawHash: withdrawHash as Hash,
      bundleHash: bundleHash as Hash,
    };
  });
  return items;
}

export function storeDepositHashes(
  withdrawHash: `0x${string}`,
  bundleHash: `0x${string}`,
  address: `0x${string}`
): void {
  const key = `${depositsKeyBase}${address}`;
  storeHashes(withdrawHash, bundleHash, key);
}

export function storeBorrowHashes(
  withdrawHash: `0x${string}`,
  bundleHash: `0x${string}`,
  address: `0x${string}`
): void {
  const key = `${borrowsKeyBase}${address}`;
  storeHashes(withdrawHash, bundleHash, key);
}

function storeHashes(
  withdrawHash: `0x${string}`,
  bundleHash: `0x${string}`,
  key: string
): void {
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

export async function getAaveBorrowsSummary(
  sdk: ViemSdk,
  address: `0x${string}`,
  items: HashItem[],
  client: ViemClient
) {
  const storageKey = `${borrowsKeyBase}${address}`;
  const summary = await getSummary(sdk, items, client, storageKey);
  return summary;
}

export async function getAaveDepositSummary(
  sdk: ViemSdk,
  address: `0x${string}`,
  items: HashItem[],
  client: ViemClient
) {
  const storageKey = `${depositsKeyBase}${address}`;
  const summary = await getSummary(sdk, items, client, storageKey);
  return summary;
}

async function getSummary(
  sdk: ViemSdk,
  items: HashItem[],
  client: ViemClient,
  storageKey: string
) {
  const isBorrow = storageKey.includes(borrowsKeyBase);
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
  let totalWeiFinalizing = BigInt(0);

  if (isBorrow) {
    totalWeiFinalizing = await getBorrowValueFinalizing(
      client,
      stillFinalizing
    );
  } else {
    totalWeiFinalizing = await getDepositValueFinalizing(
      client,
      stillFinalizing
    );
  }

  return {
    totalWeiFinalizing,
    countFinalizing: stillFinalizing.length,
  };
}

async function getDepositValueFinalizing(
  client: ViemClient,
  stillFinalizing: HashItem[]
) {
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
  return totalWeiFinalizing;
}

async function getBorrowValueFinalizing(
  client: ViemClient,
  stillFinalizing: HashItem[]
) {
  const txResults = await Promise.allSettled(
    stillFinalizing.map((item) =>
      getGhoBorrowedFromTxCalldata(client, item.bundleHash)
    )
  );

  let totalWeiFinalizing = BigInt(0);

  for (const tx of txResults) {
    if (tx.status === "fulfilled" && tx.value) {
      const raw = tx.value ?? BigInt(0);
      totalWeiFinalizing += raw;
    }
  }
  return totalWeiFinalizing;
}

export async function getGhoBorrowedFromTxCalldata(
  client: ViemClient,
  hash: Hex
) {
  const tx = await client.l2.getTransaction({ hash }); // or client.getTransaction
  if (!tx.input) throw new Error("Missing tx input");

  // 1. Decode the sendBundleToL1 call
  const decodedBundle = decodeFunctionData({
    abi: L2_INTEROP_CENTER_JSON.abi,
    data: tx.input,
  });

  if (decodedBundle.functionName !== "sendBundleToL1") {
    throw new Error("Not a sendBundleToL1 transaction");
  }

  if (!decodedBundle.args || !Array.isArray(decodedBundle.args)) {
    console.log("decode bundle wrong", decodedBundle);
    return;
  }

  const ops = decodedBundle.args[0] as ShadowAccountOp[];

  // 2. Find the Aave borrow op
  const borrowOp = ops.find(
    (op) =>
      op.target.toLowerCase() === CONTRACT_ADDRESSES.aavePool.toLowerCase()
  );
  if (!borrowOp) throw new Error("No borrow op found in bundle");

  // 3. Decode the inner IPool.borrow call
  const decodedBorrow = decodeFunctionData({
    abi: I_POOL_JSON.abi,
    data: borrowOp.data,
  });

  if (decodedBorrow.functionName !== "borrow") {
    throw new Error("Inner call is not IPool.borrow");
  }

  // borrow(ghoTokenAddress, ghoAmount, 2, 0, shadowAccount)
  const [, ghoAmount] = decodedBorrow.args as [
    `0x${string}`,
    bigint,
    bigint,
    bigint,
    `0x${string}`
  ];

  return ghoAmount;
}
