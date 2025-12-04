import { ETH_ADDRESS } from "@matterlabs/zksync-js/core";
import { zksyncOSTestnet } from "./wagmi";
import { type EIP1193Provider } from "viem";
import { UseAccountReturnType, Config } from "wagmi";
import { type ViemSdk } from "@matterlabs/zksync-js/viem";

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
