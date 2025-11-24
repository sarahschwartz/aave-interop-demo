import { Dispatch, SetStateAction } from "react";
import { ExtLinkIcon } from "@/components/ui/ExtLinkIcon";
import { WalletIcon } from "../ui/WalletIcon";
import { useWalletClient } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/utils/constants";

type Props = {
  setShowSupplyModal: Dispatch<SetStateAction<boolean>>;
  hashes: [`0x${string}`, `0x${string}`];
  amount: string;
};

export default function BorrowSuccessForm({
  setShowSupplyModal,
  hashes,
  amount,
}: Props) {
  const { data: walletClient } = useWalletClient();

  async function addGHOTokenToWallet(){
  if (!walletClient) return

    await walletClient.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: CONTRACT_ADDRESSES.l2GhoToken,
          symbol: 'GHO',
          decimals: 18,
          image: 'https://app.aave.com/icons/tokens/gho.svg',
        },
      },
    })
  }

  return (
    <div className="flex flex-col w-[360px]">
      <div className="flex justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/x.svg"
          alt="exit-form"
          className="cursor-pointer h-12 w-12"
          draggable={false}
          onClick={() => setShowSupplyModal(false)}
        />
      </div>
      <div className="flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/check.svg"
          alt="check"
          className="h-12 w-12 rounded-full bg-black"
          draggable={false}
        />

        <div className="text-xl font-bold mt-3">All done</div>

        <div className="text-sm">You borrowed {amount} GHO</div>
                <div className="text-sm flex flex-col items-center gap-2 rounded-2xl text-slate-100 mt-6 mb-2 border border-gray-700 p-4">
          <div>Add token to wallet to track your balance</div>
          <button
            className="cursor-pointer bg-gray-700 p-2 rounded-md border border-gray-600"
            onClick={addGHOTokenToWallet}
          >
            <WalletIcon
              sx={{ width: "20px", height: "20px", marginRight: "4px" }}
            />
            <span>Add to wallet</span>
          </button>
        </div>
      </div>

      <a
        target="_blank"
        href={`https://zksync-os-testnet-alpha.staging-scan-v2.zksync.dev/tx/${hashes[0]}`}
        rel="noopener noreferrer"
      >
        <div className="text-center mt-4 bg-gray-700 cursor-pointer border border-transparent hover:border-gray-200 py-2 w-full rounded-md">
          <span>Review withdraw to L1 details</span>
          <ExtLinkIcon />
        </div>
      </a>
      <a
        target="_blank"
        href={`https://zksync-os-testnet-alpha.staging-scan-v2.zksync.dev/tx/${hashes[1]}`}
        rel="noopener noreferrer"
      >
        <div className="text-center mt-4 bg-gray-700 cursor-pointer border border-transparent hover:border-gray-200 py-2 w-full rounded-md">
          <span>Review tx bundle details</span>
          <ExtLinkIcon />
        </div>
      </a>
      <button
        onClick={() => setShowSupplyModal(false)}
        className="mt-4 bg-white text-black cursor-pointer hover:bg-gray-300 py-2 w-full rounded-md"
      >
        Ok, Close
      </button>
    </div>
  );
}
