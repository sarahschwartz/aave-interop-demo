import Image from "next/image";
import { GRADIENT } from "@/utils/constants";

export default function Stats() {
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
          <div className="flex font-bold gap-1 text-lg">
            <span>$</span>
            <span className="text-white">0</span>
          </div>
        </div>

        <div>
          <div>Net APY</div>
          <div className="font-bold text-lg">
            <span>—</span>
          </div>
        </div>

        <div>
          <div>Available rewards</div>
          <div className="flex font-bold gap-1 text-lg">
            <span>$</span>
            <span className="text-white">0</span>
            <button
              className="text-white rounded-md px-1 ml-1 text-[10px] cursor-pointer"
              style={{ background: GRADIENT }}
            >
              CLAIM
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
