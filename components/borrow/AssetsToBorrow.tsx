import { Dispatch, SetStateAction, useState } from "react";
import type { Config, UseAccountReturnType } from "wagmi";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
// import SupplyForm from "../supply/SupplyForm";
import type { ViemSdk, ViemClient } from "@dutterbutter/zksync-sdk/viem";
import {
  SkeletonAsset,
  SkeletonBasic,
  SkeletonButtons,
} from "../ui/SkeletonSupplies";
import { tableHeaderStyle } from "@/utils/constants";
import Tooltip from "../ui/Tooltip";
import BorrowForm from "./BorrowForm";
import { AaveData } from "@/utils/types";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { formatEther } from "viem";
import { BlueInfoBox } from "../ui/BlueInfoBox";

interface Props {
  sdk?: ViemSdk;
  client?: ViemClient;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  // updateCount: number;
  //   ethPrice: number;
  isLoading: boolean;
  account: UseAccountReturnType<Config>;
  aaveData?: AaveData;
  healthFactor?: number;
}

export default function AssetsToBorrow({
  isLoading,
  sdk,
  client,
  setUpdateCount,
  // updateCount,
  account,
  aaveData,
  healthFactor
}: Props) {
  const [showBorrowModal, setShowBorrowModal] = useState<boolean>(false);

  const available = aaveData
    ? parseFloat(formatEther(aaveData.maxAdditionalGho)).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )
    : "0";

    const notAvailableToBorrow = !aaveData || aaveData?.totalCollateralBase <= BigInt(0) || (healthFactor && healthFactor < 1.2) as boolean;

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

      <Dialog
        open={showBorrowModal}
        onClose={setShowBorrowModal}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              style={{ backgroundColor: "#292e41" }}
              className="text-white relative transform overflow-hidden rounded-sm text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 w-[420px] data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="px-6 py-4">
                {!aaveData || !aaveData.maxAdditionalGho ? (
                  <div>
                    <ErrorBox />
                  </div>
                ) : (
                  <BorrowForm
                    aaveData={aaveData}
                    setShowBorrowModal={setShowBorrowModal}
                    account={account}
                    sdk={sdk}
                    client={client}
                    setUpdateCount={setUpdateCount}
                    healthFactor={healthFactor}
                  />
                )}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
