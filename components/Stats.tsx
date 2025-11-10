import Image from "next/image";
import { GRADIENT, SKELETON_STYLE } from "@/utils/constants";
import { useMemo } from "react";
import { Skeleton } from "@mui/material";

export default function Stats({ ethBalance, ethPrice, isLoading }: { ethBalance: string, ethPrice: number, isLoading: boolean}) {
   const usdValue = useMemo(
      () => Math.round(parseFloat(ethBalance) * ethPrice * 100) / 100,
      [ethBalance, ethPrice]
    );

  return (
    <>
      <div className="flex gap-2 mx-4">
        <Image src="ethereum.svg" alt="Ethereum logo" width={32} height={32} />
        <div className="text-white font-bold text-3xl">
          Ethereum Market <span className="text-lg">(via ZKsync)</span>
        </div>
      </div>

      <div className="mx-4 text-gray-400 text-sm flex gap-6 mt-4">
        <div>
          <div>Net Worth</div>
               {isLoading ? (
          <Skeleton sx={SKELETON_STYLE} width={60} height={35} />
        ) : (
          <div className="flex font-bold gap-1 text-xl">
            <span>$</span>
            <span className="text-white">{usdValue}</span>
          </div>
        )}
          
        </div>

        <div>
          <div>Net APY</div>
          <div className="font-bold text-xl">
             {isLoading ? (
          <Skeleton sx={SKELETON_STYLE} width={60} height={35} />
        ) : (
          <div>
            {usdValue > 0 ? (
              <span><span className='text-white'>0</span> %</span>
            ) : (
              <span>-</span>
            )}
            </div>
        )}
          </div>
        </div>

        <div>
          <div>Available rewards</div>
          {isLoading ? (
          <Skeleton sx={SKELETON_STYLE} width={60} height={35} />
        ) : (
           <div className="flex font-bold gap-1 text-xl">
            <span>$</span>
            <span className="text-white">0</span>
            <button
              className="text-white rounded-md px-1 ml-1 text-[10px] cursor-pointer"
              style={{ background: GRADIENT }}
            >
              CLAIM
            </button>
          </div>
        )}
         
        </div>
      </div>
    </>
  );
}
