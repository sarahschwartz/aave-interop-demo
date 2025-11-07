import { ETH_ADDRESS } from "@dutterbutter/zksync-sdk/core";
import { zksyncOSTestnet } from "./wagmi";
import { EIP1193Provider, parseEther } from "viem";
import { UseAccountReturnType, Config } from "wagmi";
import { ViemSdk } from "@dutterbutter/zksync-sdk/viem";

export async function initWithdraw(
  account: UseAccountReturnType<Config>,
  amount: string,
  sdk: ViemSdk
) {
  if (!account || !account.connector || !account.connector.getProvider) {
    console.log("no account found, try reconnecting");
    return;
  }
  try {
    const provider = (await account.connector.getProvider()) as
      | EIP1193Provider
      | undefined;
    if (!provider) {
      console.log("no provider, try connecting wallet again");
      return;
    }
    // confirm correct chain is connected, switch if not
    const currentHex = await provider.request({ method: "eth_chainId" });
    if (typeof currentHex === "string") {
      const parsed = Number.parseInt(currentHex, 16);
      if (Number.isFinite(parsed) && parsed !== zksyncOSTestnet.id) {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${zksyncOSTestnet.id.toString(16)}` }],
        });
      }
    }
    const params = {
      token: ETH_ADDRESS,
      amount: parseEther(amount),
      to: account.address,
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
      alert("something went wrong");
    }
    storeRecentHash(hash);
    console.log("withdraw intitiated");
    return hash;
  } catch (e) {
    alert("something went wrong");
    console.log("ERROR:", e);
    return;
  }
}

function storeRecentHash(hash: string): void {
  const key = 'latestAaveZKsyncDeposits';

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

  hashes.push(hash);

  if (hashes.length > 5) {
    hashes = hashes.slice(hashes.length - 5);
  }

  localStorage.setItem(key, JSON.stringify(hashes));
}
