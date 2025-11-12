import { StyledSwitch } from "./ui/StyledSwitch";
import type { DepositRow } from "@/utils/types";
import Tooltip from "./ui/Tooltip";
import {
  SkeletonAsset,
  SkeletonBasic,
  SkeletonButtons,
} from "./ui/SkeletonSupplies";
import {
  checkChainId,
  getFinalizeBundleParams,
  updateStoredHashes,
} from "@/utils/withdraw";
import type { ViemClient } from "@dutterbutter/zksync-sdk/viem";
import { type UseAccountReturnType, type Config } from "wagmi";
import { writeContract } from "@wagmi/core";
import { sepolia } from "viem/chains";
import { Dispatch, SetStateAction } from "react";
import { config } from "@/utils/wagmi";
import { Hash } from "@dutterbutter/zksync-sdk";

interface Props {
  isLoading: boolean;
  latestHashes: DepositRow[];
  finalizingDeposits: DepositRow[];
  ethBalance: string;
  usdValue: number;
  client?: ViemClient;
  account: UseAccountReturnType<Config>;
  setUpdateCount: Dispatch<SetStateAction<number>>;
}

export function SuppliedAssets({
  isLoading,
  latestHashes,
  finalizingDeposits,
  ethBalance,
  usdValue,
  client,
  account,
  setUpdateCount,
}: Props) {
  const tableHeaderStyle =
    "text-xs text-gray-300 border-b border-gray-500 pb-2";

  const statsStyles = "p-0.5 border border-gray-600 rounded-sm";

  async function finalizeBundles() {
    const address = account.address;
    if (!address || !client) return;
    try {
      // switches chain to sepolia
      await checkChainId(account, sepolia.id);

      const bundlesToFinalize = latestHashes.filter(
        (i) => i.phase === "FINALIZED"
      );
      const bundleHashes: Hash[] = [];
      for await (const i of bundlesToFinalize) {
        const bundleParams = await getFinalizeBundleParams(
          i.bundleHash,
          client
        );
        if (!bundleParams) {
          console.log("missing bundle params for " + i.bundleHash);
          continue;
        }
        await writeContract(config, bundleParams);
        bundleHashes.push(i.bundleHash);
      }

      console.log("bundle hashes:", bundleHashes);

      updateStoredHashes(address, bundleHashes);
      // needs to wait for local storage to update
      await new Promise((resolve) => setTimeout(resolve, 3 * 1000));
      setUpdateCount((prev) => prev + 1);
    } catch (e) {
      console.log("Error finalizing bundle", e);
    }
  }

  return (
    <div>
      {!isLoading && (!ethBalance || parseFloat(ethBalance) === 0) ? (
        <div className="text-gray-400 text-sm mt-10">Nothing supplied yet</div>
      ) : (
        <div>
          {!isLoading && (
            <div className="ml-1 flex gap-2 text-sm mt-4 text-gray-400">
              <div className={statsStyles}>
                Balance $ <span className="text-white">{usdValue}</span>
              </div>
              <div className={statsStyles + " flex items-center gap-1"}>
                <span>
                  APY <span className="text-white">0</span> %
                </span>{" "}
                <Tooltip text="The weighted average of APY for all supplied assets, including incentives." />
              </div>
              <div className={statsStyles + " flex items-center gap-1"}>
                <span>
                  Collateral $ <span className="text-white">{usdValue}</span>
                </span>{" "}
                <Tooltip text="The total amount of your assets denominated in USD that can be used as collateral for borrowing assets." />
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-5 w-full gap-y-4 items-center">
            <div className={tableHeaderStyle}>Asset</div>
            <div className={tableHeaderStyle}>
              <span>Balance</span>
              <Tooltip
                styles="ml-2"
                text={
                  isLoading
                    ? "loading..."
                    : finalizingDeposits && finalizingDeposits.length > 0
                    ? `${finalizingDeposits.length} ${
                        finalizingDeposits.length === 1 ? "txn" : "txns"
                      } still finalizing on L1. This usually takes ~5-7 minutes.`
                    : "All txns finalized ✅"
                }
              />
            </div>
            <div className={tableHeaderStyle}>APY</div>
            <div className={tableHeaderStyle}>Collateral</div>
            <div className={tableHeaderStyle}>
              <span className="opacity-0">-</span>
            </div>
            <div className="flex gap-1">
              {isLoading ? (
                <SkeletonAsset />
              ) : (
                <div className="flex gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="eth.svg" alt="ETH logo" className="w-6 h-6 mr-1" />
                  <div>ETH</div>
                </div>
              )}
            </div>
            {isLoading ? (
              <SkeletonBasic />
            ) : (
              <div className="flex items-center flex-col max-w-14">
                <div>
                  {Math.round(parseFloat(ethBalance) * 100000) / 100000}
                </div>
                <div className="text-gray-400 text-xs">$ {usdValue}</div>
              </div>
            )}

            {isLoading ? <SkeletonBasic /> : <div>0%</div>}

            {isLoading ? (
              <SkeletonBasic />
            ) : (
              <div>
                <StyledSwitch />
              </div>
            )}

            {isLoading ? (
              <SkeletonButtons />
            ) : (
              <div>
                {latestHashes.length > 0 ? (
                  <div>
                    {latestHashes.some((row) => row.phase === "FINALIZED") ? (
                      <button
                        onClick={finalizeBundles}
                        className="cursor-pointer bg-white text-black p-2 rounded-md text-sm"
                      >
                        Finalize L1 Aave Deposit
                      </button>
                    ) : (
                      <div className="text-xs">
                        {`${finalizingDeposits.length} ${
                          finalizingDeposits.length === 1 ? "txn" : "txns"
                        } still finalizing on L1. This usually takes ~5-7 minutes.`}
                      </div>
                    )}
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
        </div>
      )}
    </div>
  );
}
