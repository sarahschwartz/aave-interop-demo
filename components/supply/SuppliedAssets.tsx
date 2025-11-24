import { StyledSwitch } from "../ui/StyledSwitch";
import Tooltip from "../ui/Tooltip";
import {
  SkeletonAsset,
  SkeletonBasic,
  SkeletonButtons,
} from "../ui/SkeletonSupplies";
import { tableHeaderStyle } from "@/utils/constants";
import { SupplyModal } from "./SupplyModal";
import { ViemClient, ViemSdk } from "@dutterbutter/zksync-sdk/viem";
import { Dispatch, SetStateAction } from "react";
import { Balance } from "@/utils/types";
import { Config, UseAccountReturnType } from "wagmi";

interface Props {
  isLoading: boolean;
  finalizingDeposits: number;
  ethBalance: string;
  usdValue: number;
  sdk?: ViemSdk;
  client?: ViemClient;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  balance: Balance | undefined;
  ethPrice: number;
  account: UseAccountReturnType<Config>;
  showSupplyModal: boolean;
  setShowSupplyModal: Dispatch<SetStateAction<boolean>>;
}

export function SuppliedAssets({
  isLoading,
  finalizingDeposits,
  ethBalance,
  usdValue,
  sdk,
  client,
  setUpdateCount,
  setShowSupplyModal,
  showSupplyModal,
  balance,
  ethPrice,
  account,
}: Props) {
  const statsStyles = "p-0.5 border border-gray-600 rounded-sm";

  const pendingText = `${finalizingDeposits} Aave ${
    finalizingDeposits === 1 ? "deposit" : "deposits"
  } still finalizing. This usually takes ~5 minutes.`;

  const formattedUsd = usdValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div>
      {!isLoading && (!ethBalance || parseFloat(ethBalance) === 0) ? (
        <div className="text-gray-400 text-sm mt-10">Nothing supplied yet</div>
      ) : (
        <div>
          {!isLoading && (
            <div className="ml-1 flex gap-2 text-sm mt-4 text-gray-400">
              <div className={statsStyles}>
                Balance $ <span className="text-white">{formattedUsd}</span>
              </div>
              <div className={statsStyles + " flex items-center gap-1"}>
                <span>
                  APY <span className="text-white">0</span> %
                </span>{" "}
                <Tooltip text="The weighted average of APY for all supplied assets, including incentives." />
              </div>
              <div className={statsStyles + " flex items-center gap-1"}>
                <span>
                  Collateral ${" "}
                  <span className="text-white">{formattedUsd}</span>
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
                    : finalizingDeposits > 0
                    ? pendingText
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
                <div className="text-gray-400 text-xs">$ {formattedUsd}</div>
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
                {finalizingDeposits > 0 ? (
                  <div className="text-xs">{pendingText}</div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowSupplyModal(true)}
                      className="cursor-pointer bg-white text-black p-2 rounded-md text-sm"
                    >
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
      <SupplyModal
        balance={parseFloat(balance?.formatted || "0.00")}
        setShowSupplyModal={setShowSupplyModal}
        showSupplyModal={showSupplyModal}
        account={account}
        sdk={sdk}
        client={client}
        setUpdateCount={setUpdateCount}
        ethPrice={ethPrice}
      />
    </div>
  );
}
