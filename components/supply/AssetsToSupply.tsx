import { Dispatch, SetStateAction, useState } from "react";
import { Config, UseAccountReturnType } from "wagmi";
import type { ViemSdk, ViemClient } from "@dutterbutter/zksync-sdk/viem";
import {
  SkeletonAsset,
  SkeletonBasic,
  SkeletonButtons,
} from "../ui/SkeletonSupplies";
import { tableHeaderStyle } from "@/utils/constants";
import { SupplyModal } from "./SupplyModal";
import { Balance } from "@/utils/types";

interface Props {
  sdk?: ViemSdk;
  client?: ViemClient;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  balance: Balance | undefined;
  ethPrice: number;
  isLoading: boolean;
  account: UseAccountReturnType<Config>;
  showSupplyModal: boolean;
  setShowSupplyModal: Dispatch<SetStateAction<boolean>>;
  shadowAccount: `0x${string}`;
}

export default function AssetsToSupply({
  sdk,
  client,
  setUpdateCount,
  balance,
  ethPrice,
  isLoading,
  account,
  showSupplyModal,
  setShowSupplyModal,
  shadowAccount
}: Props) {
  const [showAssetsWith0Balance, setShowAssetsWith0Balance] =
    useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (e: any) => {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setShowAssetsWith0Balance(value);
  };

  const docsLink =
    "https://docs.zksync.io/zksync-network/zksync-os/network-details#get-funds-for-your-wallet";

  return (
    <div>
      {balance?.value === BigInt(0) ? (
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
              <div>{balance?.formatted.slice(0, 8)}</div>
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

      <SupplyModal
        balance={parseFloat(balance?.formatted || "0.00")}
        setShowSupplyModal={setShowSupplyModal}
        showSupplyModal={showSupplyModal}
        account={account}
        sdk={sdk}
        client={client}
        setUpdateCount={setUpdateCount}
        ethPrice={ethPrice}
        shadowAccount={shadowAccount}
      />
    </div>
  );
}
