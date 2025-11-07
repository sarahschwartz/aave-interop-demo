import { zksyncOSTestnet } from "@/utils/wagmi";
import { type WithdrawalStatus } from "@dutterbutter/zksync-sdk";
import { type ViemSdk } from "@dutterbutter/zksync-sdk/viem";
import { useEffect, useState } from "react";
import { createPublicClient, formatEther, Hash, http } from "viem";
import Spinner from "./ui/Spinner";
import { Skeleton, Switch, Tooltip } from "@mui/material";

interface HashInfo {
  hash: string;
  status: WithdrawalStatus;
}

type WithdrawalPhase =
  | "L2_PENDING" // tx not in an L2 block yet
  | "L2_INCLUDED" // we have the L2 receipt
  | "PENDING" // inclusion known; proof data not yet derivable/available
  | "READY_TO_FINALIZE" // Ready to call finalize on L1
  | "FINALIZING" // L1 tx sent but not picked up yet
  | "FINALIZED" // L2-L1 tx finalized on L1
  | "FINALIZE_FAILED" // prior L1 finalize reverted
  | "UNKNOWN";

export type DepositRow = {
  hash: Hash;
  valueWei: bigint;
  valueEth: string;
  phase: WithdrawalPhase;
};

const SKELETON_STYLE = { bgcolor: "#444756" };

export function SuppliedAssets({ sdk }: { sdk?: ViemSdk }) {
  const [latestHashes, setLatestHashes] = useState<HashInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ethBalance, setEthBalance] = useState<string>();
  const [finalizingDeposits, setFinalizingDeposits] = useState<DepositRow[]>();

  const tableHeaderStyle =
    "text-xs text-gray-300 border-b border-gray-500 pb-2";

  useEffect(() => {
    async function checkStatus() {
      setIsLoading(true);
      const hashes = localStorage.getItem("latestAaveZKsyncDeposits");
      if (!hashes || !sdk) {
        setIsLoading(false);
        console.log("no hashes or no sdk");
        return;
      }

      try {
        const json = JSON.parse(hashes);
        console.log("latest Hashes:", json);
        setLatestHashes(json);

        const client = createPublicClient({
          chain: zksyncOSTestnet,
          transport: http(),
        });

        const [txs, phases] = await Promise.all([
          Promise.allSettled(
            json.map((hash: `0x${string}`) => client.getTransaction({ hash }))
          ),
          Promise.allSettled(
            json.map((hash: `0x${string}`) => sdk.withdrawals.status(hash))
          ),
        ]);

        const rows: DepositRow[] = json.map(
          (hash: `0x${string}`, i: number) => {
            const txR = txs[i];
            const stR = phases[i];

            const valueWei =
              txR.status === "fulfilled" && txR.value
                ? txR.value.value ?? BigInt(0)
                : BigInt(0);
            const phase =
              stR.status === "fulfilled"
                ? stR.value.phase
                : ("PENDING" as WithdrawalPhase);

            return {
              hash,
              valueWei,
              valueEth: formatEther(valueWei),
              phase,
            };
          }
        );

        const totalWei = rows.reduce((acc, r) => acc + r.valueWei, BigInt(0));
        const anyFinalizing = rows.filter((r) => r.phase !== "FINALIZED");

        console.log("total eth:", formatEther(totalWei));
        console.log("anyFinalizing:", anyFinalizing);

        setEthBalance(formatEther(totalWei));
        setFinalizingDeposits(anyFinalizing);
      } catch (e) {
        console.log("ERROR:", e);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [sdk]);

  return (
    <div>
      {!isLoading && latestHashes.length === 0 ? (
        <div className="text-gray-400 text-sm mt-10">Nothing supplied yet</div>
      ) : (
        <div className="mt-8 grid grid-cols-5 w-full gap-y-4 items-center">
          <div className={tableHeaderStyle}>Assets</div>
          <div className={tableHeaderStyle}>
            <span>Balance</span>
            <Tooltip title={finalizingDeposits &&  finalizingDeposits.length > 0 ? `${finalizingDeposits.length} tx still finalizing on L1` : 'all txns finalized'} placement="top">
            <span
                aria-hidden
                className="cursor-default ml-2 inline-flex h-3 w-3 items-center justify-center rounded-full border border-slate-500 text-[10px] leading-none text-slate-400"
              >
                i
              </span>
              </Tooltip>
            </div>
          <div className={tableHeaderStyle}>APY</div>
          <div className={tableHeaderStyle}>Collateral</div>
          <div className={tableHeaderStyle}><span className='opacity-0'>-</span></div>
          <div className="flex gap-1">
            {isLoading ? (
              <div className="flex gap-2">
                <Skeleton
                  sx={SKELETON_STYLE}
                  variant="circular"
                  width={35}
                  height={35}
                />
                <Skeleton sx={SKELETON_STYLE} width={35} height={35} />
              </div>
            ) : (
              <div className='flex gap-1'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="eth.svg" alt="ETH logo" className="w-6 h-6 mr-1" />
                <div>ETH</div>
              </div>
            )}
          </div>
          {isLoading ? (
            <Skeleton sx={SKELETON_STYLE} width={60} height={35} />
          ) : (
            <div>{ethBalance}</div>
          )}

          {isLoading ? (
            <Skeleton sx={SKELETON_STYLE} width={60} height={35} />
          ) : (
            <div>0%</div>
          )}

          {isLoading ? (
            <Skeleton sx={SKELETON_STYLE} width={60} height={35} />
          ) : (
            <div>
              <Switch disabled defaultChecked />
            </div>
          )}

          {isLoading ? (
            <div className='flex gap-2'>
            <Skeleton sx={SKELETON_STYLE} width={60} height={55} />
            <Skeleton sx={SKELETON_STYLE} width={60} height={55} />
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button className="cursor-pointer bg-white text-black p-2 rounded-md text-sm">
                Supply
              </button>
              <button className="cursor-pointer border border-gray-600 hover:border-gray-300 bg-gray-700 py-2 px-4 rounded-md text-sm">
                Withdraw
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
