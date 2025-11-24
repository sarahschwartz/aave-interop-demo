import { ClipboardIcon } from "@heroicons/react/solid";
import Image from "next/image";

export default function Header({ shadowAccount, copy }: { shadowAccount?: string, copy: () => void}) {
  return (
    <div className="mx-8">
    <div className="flex gap-2">
      <Image src="ethereum.svg" alt="Ethereum logo" width={32} height={32} />
      <div className="text-white font-bold text-3xl">
        Ethereum Market <span className="text-lg">(via ZKsync)</span>
      </div>
    </div>
    {shadowAccount && (
      <div className="text-gray-400 flex gap-2 mt-2">
        <div>Your L1 Shadow Account: {shadowAccount.slice(0,10)}...{shadowAccount.slice(-8)}</div>
        <ClipboardIcon onClick={copy} className='h-5 w-5 cursor-pointer' />
      </div>
    )}
    </div>
  );
}
