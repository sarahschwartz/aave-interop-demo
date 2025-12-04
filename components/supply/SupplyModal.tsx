import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Dispatch, SetStateAction } from "react";
import SupplyForm from "./SupplyForm";
import type { ViemClient, ViemSdk } from "@matterlabs/zksync-js/viem";
import { Config, UseAccountReturnType } from "wagmi";

interface Props {
  showSupplyModal: boolean;
  setShowSupplyModal: Dispatch<SetStateAction<boolean>>;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  sdk?: ViemSdk;
  client?: ViemClient;
  account: UseAccountReturnType<Config>;
  balance: number | bigint;
  ethPrice: number;
  shadowAccount: `0x${string}`;
}

export function SupplyModal({
  showSupplyModal,
  setShowSupplyModal,
  sdk,
  client,
  account,
  setUpdateCount,
  balance,
  ethPrice,
  shadowAccount
}: Props) {
    return (
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
                          balance={balance}
                          setShowSupplyModal={setShowSupplyModal}
                          account={account}
                          sdk={sdk}
                          client={client}
                          setUpdateCount={setUpdateCount}
                          ethPrice={ethPrice}
                          shadowAccount={shadowAccount}
                        />
                      </div>
                    </DialogPanel>
                  </div>
                </div>
              </Dialog>
    )
}