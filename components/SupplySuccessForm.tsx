import { Dispatch, SetStateAction } from "react";
import { ExternalLinkIcon } from "@heroicons/react/outline";
import { SvgIcon } from "@mui/material";
import { WalletIcon } from "./ui/WalletIcon";

type Props = {
  setShowSupplyModal: Dispatch<SetStateAction<boolean>>;
  hash: string;
  amount: string;
};

const ExtLinkIcon = () => (
  <SvgIcon sx={{ ml: 2, fontWeight: 800, fontSize: "20px", color: "white" }}>
    <ExternalLinkIcon />
  </SvgIcon>
);

function addSupplyTokenToWallet() {
  // TODO: implement
  console.log("added token");
}

export default function SupplySuccessForm({
  setShowSupplyModal,
  hash,
  amount,
}: Props) {
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

        <div className="text-sm">You supplied {amount} ETH</div>

        <div className="text-sm flex flex-col items-center gap-2 rounded-2xl text-slate-100 mt-6 mb-2 border border-gray-700 p-4">
          <div>Add aToken to wallet to track your balance</div>
          <button
            className="cursor-pointer bg-gray-700 p-2 rounded-md border border-gray-600"
            onClick={addSupplyTokenToWallet}
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
        href={`https://zksync-os-testnet-alpha.staging-scan-v2.zksync.dev/tx/${hash}`}
        rel="noopener noreferrer"
      >
        <div className="text-center mt-4 bg-gray-700 cursor-pointer border border-transparent hover:border-gray-200 py-2 w-full rounded-md">
          <span>Review tx details</span>
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
