import { Dispatch, SetStateAction } from "react";
import type { Config, UseAccountReturnType } from "wagmi";
import type { ViemSdk, ViemClient } from "@matterlabs/zksync-js/viem";
import {
  SkeletonAsset,
  SkeletonBasic,
  SkeletonButtons,
} from "../ui/SkeletonSupplies";
import { tableHeaderStyle } from "@/utils/constants";
import Tooltip from "../ui/Tooltip";
import { AaveData } from "@/utils/types";
import { BlueInfoBox } from "../ui/BlueInfoBox";
import { BorrowModal } from "./BorrowModal";

interface Props {
  sdk?: ViemSdk;
  client?: ViemClient;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  isLoading: boolean;
  account: UseAccountReturnType<Config>;
  aaveData?: AaveData;
  healthFactor?: number;
  showBorrowModal: boolean;
  setShowBorrowModal: Dispatch<SetStateAction<boolean>>;
  ethPrice: number;
  available: string;
  shadowAccount: `0x${string}`;
}

export default function AssetsToBorrow({
  isLoading,
  sdk,
  client,
  setUpdateCount,
  account,
  aaveData,
  healthFactor,
  showBorrowModal,
  setShowBorrowModal,
  ethPrice,
  available,
  shadowAccount
}: Props) {
  const notAvailableToBorrow =
    !aaveData ||
    aaveData?.totalCollateralBase <= BigInt(0) ||
    ((healthFactor && healthFactor < 1.2) as boolean);

  return (
    <div>
      {notAvailableToBorrow && (
        <BlueInfoBox text="To borrow you need to supply any asset to be used as collateral." />
      )}
      <>
        <div className="mt-8 grid grid-cols-4 w-full gap-y-4 items-center">
          <div className={tableHeaderStyle}>Asset</div>
          <div className={tableHeaderStyle}>
            <span>Available</span>
            <Tooltip
              text="This is the total amount available for you to borrow. You can borrow based on your collateral and until the borrow cap is reached."
              styles="ml-1"
            />
          </div>
          <div className={tableHeaderStyle}>
            <span>APY, variable</span>
            <Tooltip
              text="Variable interest rate will fluctuate based on the market conditions."
              styles="ml-1"
            />
          </div>
          <div className={tableHeaderStyle}>
            <span className="opacity-0">-</span>
          </div>

          {isLoading ? (
            <SkeletonAsset />
          ) : (
            <div className="flex gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="gho.svg" alt="GHO logo" className="w-6 h-6 mr-1" />
              <div>GHO</div>
            </div>
          )}
          {isLoading ? (
            <SkeletonBasic />
          ) : (
            <div className="ml-2">
              <div>{available}</div>
              <div className="text-gray-400 text-xs">$ {available}</div>
            </div>
          )}

          {isLoading ? <SkeletonBasic /> : <div className="ml-4">2.02 %</div>}

          {isLoading ? (
            <SkeletonButtons />
          ) : (
            <div className="flex gap-2 justify-end">
              <button
                disabled={notAvailableToBorrow}
                onClick={() => setShowBorrowModal(true)}
                className="cursor-pointer bg-white text-black p-2 rounded-md text-sm disabled:bg-gray-600 disabled:text-gray-400"
              >
                Borrow
              </button>
              <button className="cursor-pointer border border-gray-600 bg-gray-700 py-2 px-4 rounded-md text-sm">
                Details
              </button>
            </div>
          )}
        </div>
      </>

      <BorrowModal
        showBorrowModal={showBorrowModal}
        aaveData={aaveData}
        setShowBorrowModal={setShowBorrowModal}
        account={account}
        sdk={sdk}
        client={client}
        setUpdateCount={setUpdateCount}
        healthFactor={healthFactor}
        ethPrice={ethPrice}
        shadowAccount={shadowAccount}
      />
    </div>
  );
}
