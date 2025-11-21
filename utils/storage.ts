import type { ViemSdk, ViemClient } from "@dutterbutter/zksync-sdk/viem";
import type { HashItem } from "./types";
import type { Hash } from "@dutterbutter/zksync-sdk";

const depositsKeyBase = 'latestAaveZKsyncDeposits-';
const borrowsKeyBase = 'latestAaveZKsyncBorrows-';

export function getHashes(address: `0x${string}`): { deposits: HashItem[] | undefined, borrows: HashItem[] | undefined } {
  const depositsKey = `${depositsKeyBase}${address}`;
  const borrowsKey = `${borrowsKeyBase}${address}`;
  const rawDepositsValue = localStorage.getItem(depositsKey);
  const rawBorrowsValue = localStorage.getItem(borrowsKey);

  let deposits;
  let borrows;

  if (rawDepositsValue){
    deposits = getParsedData(rawDepositsValue);
  }

  if (rawBorrowsValue){
    borrows = getParsedData(rawBorrowsValue);
  }
 
  return { deposits, borrows };
}

function getParsedData(rawValue: string){
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
  address: `0x${string}`,
): void {
  const key = `${depositsKeyBase}${address}`;
  storeHashes(withdrawHash, bundleHash, key);
}

export function storeBorrowHashes(
  withdrawHash: `0x${string}`,
  bundleHash: `0x${string}`,
  address: `0x${string}`,
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


