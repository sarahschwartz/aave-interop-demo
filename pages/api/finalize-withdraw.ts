import { ETH_ADDRESS } from "@dutterbutter/zksync-sdk/core";
import { createViemClient, createViemSdk } from "@dutterbutter/zksync-sdk/viem";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  Account,
  Address,
  Chain,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  Transport,
  WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const l1 = createPublicClient({ transport: http(process.env.L1_RPC_URL) });
const l2 = createPublicClient({ transport: http(process.env.L2_RPC_URL) });
const l1Wallet: WalletClient<Transport, Chain, Account> = createWalletClient({
  account,
  transport: http(process.env.L1_RPC_URL),
});
const l2Wallet = createWalletClient<Transport, Chain, Account>({
  account,
  transport: http(process.env.L2_RPC_URL),
});

const client = createViemClient({ l1, l2, l1Wallet, l2Wallet });
const sdk = createViemSdk(client);

async function finalizeWithdrawal(hash: `0x${string}`) {
  console.log("STATUS (initial):", await sdk.withdrawals.status(hash));

  const l2Receipt = await sdk.withdrawals.wait(hash, { for: "l2" });
  console.log("L2 included tx:", l2Receipt?.transactionHash);

  await sdk.withdrawals.wait(hash, { for: "ready" });
  console.log("STATUS (ready):", await sdk.withdrawals.status(hash));

  const fin = await sdk.withdrawals.tryFinalize(hash);
  console.log('TRY FINALIZE:', fin);

  const l1Receipt = await sdk.withdrawals.wait(hash, { for: 'finalized' });
  console.log('Finalized. L1 receipt:', l1Receipt?.transactionHash);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" || !process.env.PRIVATE_KEY)
    return res.status(405).end();

  const { hash } = req.body as {
    hash: `0x${string}`;
  };

  console.log("received withdraw request for hash:", hash);

  await finalizeWithdrawal(hash);

  res.status(200).json({ ok: true });
}
