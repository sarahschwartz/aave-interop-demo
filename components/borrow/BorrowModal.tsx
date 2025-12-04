import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Dispatch, SetStateAction } from "react";
import { ErrorBox } from "../ui/ErrorBox";
import BorrowForm from "./BorrowForm";
import type { AaveData } from "@/utils/types";
import type { ViemClient, ViemSdk } from "@matterlabs/zksync-js/viem";
import { Config, UseAccountReturnType } from "wagmi";

interface Props {
  showBorrowModal: boolean;
  setShowBorrowModal: Dispatch<SetStateAction<boolean>>;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  sdk?: ViemSdk;
  client?: ViemClient;
  aaveData?: AaveData;
  account: UseAccountReturnType<Config>;
  healthFactor?: number;
  ethPrice: number;
  shadowAccount: `0x${string}`;
}

export function BorrowModal({
  showBorrowModal,
  setShowBorrowModal,
  sdk,
  client,
  aaveData,
  account,
  setUpdateCount,
  healthFactor,
  ethPrice,
  shadowAccount
}: Props) {
  return (
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
                  ethPrice={ethPrice}
                  shadowAccount={shadowAccount}
                />
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
