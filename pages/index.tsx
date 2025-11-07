import { Inter } from "next/font/google";
import { useConnect, useAccount, useChainId } from "wagmi";
import { injected } from "wagmi/connectors";
import { NavItems } from "@/components/NavItems";
import { useEffect, useState } from "react";
import Image from "next/image";
import SupplyAndBorrow from "@/components/SupplyAndBorrow";
import Stats from "@/components/Stats";
import { zksyncOSTestnet } from "@/utils/wagmi";
import ConnectButton from "@/components/ConnectButton";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function Home() {
  const { connect } = useConnect();
  const account = useAccount();
  const currentChainId = useChainId()
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  return (
    <div className={`${inter.className} font-sans`}>
      <div className="border-b border-gray-700 flex align-middle gap-10 px-4">
        <Image src="aave.svg" alt="Aave logo" width={72} height={72} />
        <NavItems />
        <div className='w-full flex justify-end'>
        <ConnectButton account={account} isMounted={hasMounted} />

        </div>
      </div>
      <div>
        {account.isConnected && hasMounted && (
          <>
            {currentChainId === zksyncOSTestnet.id ? (
              <div className="mt-12 mx-12">
                <Stats />
                <SupplyAndBorrow account={account} />
              </div>
            ) : (
              <div className='text-white flex justify-center mt-[200px]'>Switch to ZKsync OS Testnet</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
