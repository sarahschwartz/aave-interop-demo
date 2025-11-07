import { useState } from "react";
import Image from "next/image";
import { useAccount, useBalance } from "wagmi";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import SupplyForm from "./SupplyForm";
import { type ViemSdk } from "@dutterbutter/zksync-sdk/viem";

export default function AssetsToSupply({ sdk }: { sdk?: ViemSdk}) {
  const [showAssetsWith0Balance, setShowAssetsWith0Balance] =
    useState<boolean>(false);
  const [showSupplyModal, setShowSupplyModal] = useState<boolean>(false);
  const account = useAccount();
  const balance = useBalance({ address: account?.address });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (e: any) => {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setShowAssetsWith0Balance(value);
  };

  const tableHeaderStyle =
    "text-xs text-gray-300 border-b border-gray-500 pb-2";

  return (
    <div>
      <div className="flex gap-2 mt-8 text-sm text-gray-200">
        <input
          type="checkbox"
          id="showAssetsWith0Balance"
          checked={showAssetsWith0Balance}
          onChange={handleChange}
        />
        <div>Show assets with 0 balance</div>
      </div>

      <div className="mt-8 grid grid-cols-5 w-full gap-y-4">
        <div className={tableHeaderStyle}>Assets</div>
        <div className={tableHeaderStyle}>Wallet balance</div>
        <div className={tableHeaderStyle}>APY</div>
        <div className={tableHeaderStyle}>Can be collateral</div>
        <div className={tableHeaderStyle}></div>

        <div className="flex gap-1">
          <Image
            src="ethereum.svg"
            alt="Ethereum logo"
            width={24}
            height={24}
          />
          <div className="mt-1">ETH</div>
        </div>
        <div>{balance.data?.formatted.slice(0, 8)}</div>
        <div>0%</div>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="check.svg" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSupplyModal(true)}
            className="cursor-pointer bg-white text-black p-2 rounded-md text-sm"
          >
            Supply
          </button>
          <button className="border border-gray-600 bg-gray-700 py-2 px-4 rounded-md text-sm">
            ...
          </button>
        </div>
      </div>

      <Dialog
        open={showSupplyModal}
        onClose={setShowSupplyModal}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              style={{ backgroundColor: "#292e41" }}
              className="text-white relative transform overflow-hidden rounded-lg text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="p-4">
                <SupplyForm
                  balance={parseFloat(balance.data?.formatted || "0.00")}
                  setShowSupplyModal={setShowSupplyModal}
                  account={account}
                  sdk={sdk}
                />
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
