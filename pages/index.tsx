import { Inter } from "next/font/google";
import { useConnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";
import { NavItems } from "@/components/NavItems";
import { useEffect, useState } from "react";
import Image from "next/image";
import SupplyAndBorrow from "@/components/SupplyAndBorrow";
import Stats from "@/components/Stats";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function Home() {
  const { connect } = useConnect();
  const { isConnected } = useAccount();
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
      </div>
      <div>
        {isConnected && hasMounted ? (
          <>
            <div className="mt-12 mx-12">
              <Stats />
              <SupplyAndBorrow />
            </div>
          </>
        ) : (
          <button
            className="cursor-pointer border-2 border-amber-200 p-4 rounded-md"
            onClick={() => connect({ connector: injected() })}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
