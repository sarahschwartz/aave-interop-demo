import Tooltip from "../ui/Tooltip";
import {
  SkeletonAsset,
  SkeletonBasic,
  SkeletonButtons,
} from "../ui/SkeletonSupplies";
import { tableHeaderStyle } from "@/utils/constants";
import type { AaveData } from "@/utils/types";
import { BorrowModal } from "./BorrowModal";
import { ViemSdk, ViemClient } from "@dutterbutter/zksync-sdk/viem";
import { Dispatch, SetStateAction } from "react";
import { UseAccountReturnType, Config } from "wagmi";

interface Props {
  isLoading: boolean;
  finalizingBorrows: number;
  sdk?: ViemSdk;
  client?: ViemClient;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  account: UseAccountReturnType<Config>;
  aaveData?: AaveData;
  ghoBorrowed: string;
  healthFactor?: number;
  showBorrowModal: boolean;
  setShowBorrowModal: Dispatch<SetStateAction<boolean>>;
}

export function BorrowedAssets({
  isLoading,
  finalizingBorrows,
  sdk,
  client,
  setUpdateCount,
  account,
  aaveData,
  ghoBorrowed,
  healthFactor,
  showBorrowModal,
  setShowBorrowModal,
}: Props) {
  const statsStyles = "p-0.5 border border-gray-600 rounded-sm";

  const pendingText = `${finalizingBorrows} Aave ${
    finalizingBorrows === 1 ? "borrow" : "borrows"
  } still finalizing. This usually takes ~5 minutes.`;

const borrowPowerUsed =
  aaveData
    ? Number(aaveData.totalDebtBase) / Number(aaveData.userBorrowCapBase) * 100
    : 0;

  return (
    <div>
      {!isLoading && (parseFloat(ghoBorrowed) == 0) ? (
        <div className="text-gray-400 text-sm mt-10">Nothing borrowed yet</div>
      ) : (
        <div>
          {!isLoading && (
            <div className="ml-1 flex gap-2 text-sm mt-4 text-gray-400">
              <div className={statsStyles}>
                Balance $ <span className="text-white">{ghoBorrowed}</span>
              </div>
              <div className={statsStyles + " flex items-center gap-1"}>
                <span>
                  APY <span className="text-white">0</span> %
                </span>{" "}
                <Tooltip text="The weighted average of APY for all supplied assets, including incentives." />
              </div>
              <div className={statsStyles + " flex items-center gap-1"}>
                <span>
                  Borrow power used <span className="text-white">{borrowPowerUsed.toFixed(1)}</span> %
                </span>{" "}
                <Tooltip text="The total amount of your assets denominated in USD that can be used as collateral for borrowing assets." />
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-4 w-full gap-y-4 items-center">
            <div className={tableHeaderStyle}>Asset</div>
            <div className={tableHeaderStyle}>
              <span>Debt</span>
            </div>
            <div className={tableHeaderStyle}>APY</div>
            <div className={tableHeaderStyle}>
              <span className="opacity-0">-</span>
            </div>
            <div className="flex gap-1">
              {isLoading ? (
                <SkeletonAsset />
              ) : (
                <div className="flex gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="gho.svg" alt="ETH logo" className="w-6 h-6 mr-1" />
                  <div>GHO</div>
                </div>
              )}
            </div>
            {isLoading ? (
              <SkeletonBasic />
            ) : (
              <div className="flex flex-col">
                <div>{ghoBorrowed}</div>
                <div className="text-gray-400 text-xs">$ {ghoBorrowed}</div>
              </div>
            )}

            {isLoading ? <SkeletonBasic /> : <div>0%</div>}

            {isLoading ? (
              <SkeletonButtons />
            ) : (
              <div>
                {finalizingBorrows > 0 ? (
                  <div className="text-xs">{pendingText}</div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowBorrowModal(true)} className="cursor-pointer bg-white text-black p-2 rounded-md text-sm">
                      Borrow
                    </button>
                    <button className="cursor-pointer border border-gray-600 hover:border-gray-300 bg-gray-700 py-2 px-4 rounded-md text-sm">
                      Repay
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <BorrowModal
        showBorrowModal={showBorrowModal}
        aaveData={aaveData}
        setShowBorrowModal={setShowBorrowModal}
        account={account}
        sdk={sdk}
        client={client}
        setUpdateCount={setUpdateCount}
        healthFactor={healthFactor}
      />
    </div>
  );
}
