import { GRADIENT } from "@/utils/constants";
import Header from "./ui/Header";
import { SkeletonBasic } from "./ui/SkeletonSupplies";

export default function Stats({ usdValue, isLoading }: { usdValue: number, isLoading: boolean}) {

  return (
    <>
      <Header />
      <div className="mx-8 text-gray-400 text-sm flex gap-6 mt-4">
        <div>
          <div>Net Worth</div>
               {isLoading ? (
          <SkeletonBasic />
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
          <SkeletonBasic />
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
          <SkeletonBasic />
        ) : (
           <div className="flex font-bold gap-1 text-xl items-center">
            <span>$</span>
            <span className="text-white">0</span>
            <button
              className="text-white rounded-md px-1.5 ml-1 text-[10px] cursor-pointer h-5"
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
