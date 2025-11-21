import { Dispatch, SetStateAction } from "react";
import { ExtLinkIcon } from "@/components/ui/ExtLinkIcon";

type Props = {
  setShowSupplyModal: Dispatch<SetStateAction<boolean>>;
  hashes: [`0x${string}`, `0x${string}`];
  amount: string;
};

export default function SupplySuccessForm({
  setShowSupplyModal,
  hashes,
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

        <div className='text-center text-sm'>The supply token will remain on the L1 in your shadow account.</div>
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
