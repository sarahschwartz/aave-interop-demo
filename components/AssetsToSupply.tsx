import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import SupplyForm from "./SupplyForm";
import { type ViemSdk } from "@dutterbutter/zksync-sdk/viem";
import {
  SkeletonAsset,
  SkeletonBasic,
  SkeletonButtons,
} from "./ui/SkeletonSupplies";

interface Props {
  sdk?: ViemSdk;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  updateCount: number;
  ethPrice: number;
  isLoading: boolean;
}

export default function AssetsToSupply({
  sdk,
  setUpdateCount,
  updateCount,
  ethPrice,
  isLoading,
}: Props) {
  const [showAssetsWith0Balance, setShowAssetsWith0Balance] =
    useState<boolean>(false);
  const [showSupplyModal, setShowSupplyModal] = useState<boolean>(false);
  const account = useAccount();
  const { data, refetch } = useBalance({ address: account?.address });

  useEffect(() => {
    refetch();
  }, [updateCount]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (e: any) => {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setShowAssetsWith0Balance(value);
  };

  const tableHeaderStyle =
    "text-xs text-gray-300 border-b border-gray-500 pb-2";

  const docsLink =
    "https://docs.zksync.io/zksync-network/zksync-os/network-details#get-funds-for-your-wallet";

  return (
    <div>
      {data?.value === BigInt(0) ? (
        <div className="flex gap-3 items-center bg-[#071f2e] p-3 rounded-sm mt-6">
          <span
            aria-hidden
            className={
              "cursor-default inline-flex h-4 w-4 items-center justify-center rounded-full border-2 font-bold text-[12px] leading-none text-[#29b6f6] border-[#29b6f6]"
            }
          >
            i
          </span>
          <div className="text-xs text-[#a9e2fb]">
            Your ZKsync OS Testnet wallet is empty. Get free test ETH at by
            following instructions in the{" "}
            <a
              target="_blank"
              href={docsLink}
              rel="noopener noreferrer"
              className="underline"
            >
              ZKsync docs
            </a>
            .
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mt-8 text-sm text-gray-200">
            <input
              type="checkbox"
              id="showAssetsWith0Balance"
              checked={showAssetsWith0Balance}
              onChange={handleChange}
            />
            <div>Show assets with 0 balance</div>
          </div>
          <div className="mt-8 grid grid-cols-5 w-full gap-y-4 items-center">
            <div className={tableHeaderStyle}>Assets</div>
            <div className={tableHeaderStyle}>Wallet balance</div>
            <div className={tableHeaderStyle}>APY</div>
            <div className={tableHeaderStyle}>Can be collateral</div>
            <div className={tableHeaderStyle}>
              <span className="opacity-0">-</span>
            </div>

            {isLoading ? (
              <SkeletonAsset />
            ) : (
              <div className="flex gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="eth.svg" alt="ETH logo" className="w-6 h-6 mr-1" />
                <div>ETH</div>
              </div>
            )}
            {isLoading ? (
              <SkeletonBasic />
            ) : (
              <div>{data?.formatted.slice(0, 8)}</div>
            )}

            {isLoading ? <SkeletonBasic /> : <div>0%</div>}

            {isLoading ? (
              <SkeletonBasic />
            ) : (
              <div className="ml-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="check.svg" alt="check" className="w-6 h-6" />
              </div>
            )}

            {isLoading ? (
              <SkeletonButtons />
            ) : (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSupplyModal(true)}
                  className="cursor-pointer bg-white text-black p-2 rounded-md text-sm"
                >
                  Supply
                </button>
                <button className="cursor-pointer border border-gray-600 bg-gray-700 py-2 px-4 rounded-md text-sm">
                  ...
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog
        open={showSupplyModal}
        onClose={setShowSupplyModal}
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
                <SupplyForm
                  balance={parseFloat(data?.formatted || "0.00")}
                  setShowSupplyModal={setShowSupplyModal}
                  account={account}
                  sdk={sdk}
                  setUpdateCount={setUpdateCount}
                  ethPrice={ethPrice}
                />
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
