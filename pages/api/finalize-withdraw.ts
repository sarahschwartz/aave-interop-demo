import { zksyncOSTestnet } from "@/utils/wagmi";
import { createViemClient, createViemSdk } from "@dutterbutter/zksync-sdk/viem";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  type Abi,
  type Account,
  type Chain,
  createPublicClient,
  createWalletClient,
  http,
  Transport,
  WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { waitForTransactionReceipt } from "viem/actions";
import L1_INTEROP_HANDLER_JSON from "@/utils/abis/L1InteropHandler.json";

const deployedL1InteropHandler = "0xB0dD4151fdcCaAC990F473533C15BcF8CE10b1de";

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
  const status = await sdk.withdrawals.status(hash);
  if (status.phase === "UNKNOWN" || status.phase === "FINALIZED") return;
  await sdk.withdrawals.wait(hash, { for: "ready" });
  await sdk.withdrawals.tryFinalize(hash);
  const l1Receipt = await sdk.withdrawals.wait(hash, { for: "finalized" });
  console.log("Finalized. L1 receipt:", l1Receipt?.transactionHash);
}

async function finalizeBundle(bundleHash: `0x${string}`) {
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

  console.log("going to finalize bundle...");
  const finalizeBundleHash = await l1Wallet.writeContract({
    address: deployedL1InteropHandler,
    abi: L1_INTEROP_HANDLER_JSON.abi as Abi,
    functionName: "receiveInteropFromL2",
    args: [params],
    account,
  });
  const { status: finalizeBundleStatus } = await waitForTransactionReceipt(l1, {
    hash: finalizeBundleHash,
  });
  if (finalizeBundleStatus !== "success") {
    console.log("something wrong finalizing bundle");
    return;
  }
  console.log("bundle finalized ✅", finalizeBundleHash);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" || !process.env.PRIVATE_KEY)
    return res.status(405).end();

  const { withdrawHash, bundleHash } = req.body as {
    withdrawHash: `0x${string}`;
    bundleHash: `0x${string}`;
  };

  console.log(
    "received withdraw request for hashes:",
    withdrawHash,
    " : ",
    bundleHash
  );

  await finalizeWithdrawal(withdrawHash);
  await finalizeBundle(bundleHash);

  res.status(200).json({ ok: true });
}
