import { getBundle, getShadowAccount, initWithdraw, storeHashes } from "@/utils/withdraw";
import type { ViemClient, ViemSdk } from "@dutterbutter/zksync-sdk/viem";
import React, {
  Dispatch,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import {
  UseAccountReturnType,
  type Config,
} from "wagmi";
import SupplySuccessForm from "./SupplySuccessForm";
import Spinner from "./ui/Spinner";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import Tooltip from "./ui/Tooltip";
import { parseEther } from "viem";
import { writeContract } from '@wagmi/core'
import { config } from "@/utils/wagmi";

type Props = {
  setShowSupplyModal: Dispatch<SetStateAction<boolean>>;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  sdk?: ViemSdk;
  client?: ViemClient;
  account: UseAccountReturnType<Config>;
  balance: number | bigint;
  ethPrice: number;
};

const Error = () => (
  <div className="text-center p-4 bg-red-500 opacity-75 rounded-sm">
    oops, something went wrong
  </div>
);

export default function EthSupplyForm({
  setShowSupplyModal,
  setUpdateCount,
  sdk,
  client,
  account,
  balance,
  ethPrice,
}: Props) {
  const [amount, setAmount] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [hashes, setHashes] = useState<[`0x${string}`, `0x${string}`]>();
  // const [gasEstimate, setGasEstimate] = useState<bigint>();

  const amountNumber = useMemo(
    () => Number(amount.replace(/,/g, "")) || 0,
    [amount]
  );

  const usdValue = useMemo(
    () => Math.round(amountNumber * ethPrice * 100) / 100,
    [amountNumber, ethPrice]
  );

  const amountIsGreaterThanZero = amount && parseFloat(amount) > 0;

  function handleMax() {
    setAmount(balance.toString());
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !sdk || !account || !client) {
      console.log("missing amount, sdk, account, or client");
      return;
    }
    setIsPending(true);

    try {
      const shadowAccount = await getShadowAccount(client, account);
      const wei = parseEther(amount);
      const wHash = await initWithdraw(account, wei, sdk, shadowAccount);
      const bundle = await getBundle(shadowAccount, wei);
      const bHash= await writeContract(config, bundle)
     
      if (!wHash || !bHash) {
        setIsError(true);
      } else {
        storeHashes(wHash, bHash, account.address!);
        setHashes([wHash, bHash]);
        setIsSuccess(true);
        setUpdateCount((prev) => prev + 1);
      }
      setIsPending(false);
    } catch (e) {
      alert("something went wrong");
      console.log("ERROR:", e);
      setIsError(true);
      setIsPending(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleChange(e: any) {
    const value =
      e.target.value > balance ? balance.toString() : e.target.value;
    setAmount(value);
    //
    //   if(!sdk) return;
    //   const quote = await estimateGas(account, parseEther(value), sdk);
    //   if(quote?.suggestedL2GasLimit){
    //     setGasEstimate(quote.suggestedL2GasLimit);
    //   }
  }

  return (
    <>
      {isError && <Error />}
      {isSuccess ? (
        <>
          {!hashes ? (
            <Error />
          ) : (
            <SupplySuccessForm
              amount={amount}
              setShowSupplyModal={setShowSupplyModal}
              hashes={hashes}
            />
          )}
        </>
      ) : (
        <div>
          <div className="flex mb-4 align-bottom justify-between">
            <div className="text-[22px] font-bold mt-3">Supply ETH</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/x.svg"
              alt="exit-form"
              className="cursor-pointer h-12 w-12"
              draggable={false}
              onClick={() => setShowSupplyModal(false)}
            />
          </div>
          <form onSubmit={handleSubmit} className="rounded-2xl text-slate-100">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <span className="text-sm font-medium">Amount</span>
              <Tooltip
                text="This is the total amount that you are able to supply to in this reserve. You are able to
        supply your wallet balance up until the supply cap is reached."
              />
            </div>

            <div className="rounded-sm border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-2">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={handleChange}
                  className="w-full bg-transparent text-xl tracking-tight outline-none placeholder:text-slate-500"
                  placeholder="0.00"
                  aria-label="Amount in ETH"
                />

                <div className="flex items-center gap-2 rounded-lg px-3">
                  {amount && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/cancel.svg"
                        alt="cancel"
                        className="cursor-pointer h-4 w-4"
                        draggable={false}
                        onClick={() => setAmount("")}
                      />
                    </>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/eth.svg"
                    alt="Ethereum"
                    className="h-6 w-6"
                    draggable={false}
                  />
                  <span className="text-md font-semibold mr-6">ETH</span>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 pb-1 text-sm">
                <span className="text-slate-400">
                  ${" "}
                  {usdValue.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    Wallet balance {balance.toString().slice(0, 8)}
                  </span>
                  <button
                    type="button"
                    onClick={handleMax}
                    className="cursor-pointer py-0.5 text-xs font-semibold tracking-wide text-slate-200 hover:bg-slate-700"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-slate-400">
              <div className="mb-2 text-sm font-medium">
                Transaction overview
              </div>

              <div className="rounded-sm border border-slate-700 text-sm">
                <div className="flex items-center justify-between px-4 py-1">
                  <span className="text-slate-200">Supply APY</span>
                  <span className="text-slate-200">
                    <span className="font-semibold mr-1 text-base">0</span>%
                  </span>
                </div>

                <div className=" flex items-center justify-between px-4 py-1">
                  <span className="text-slate-200">Collateralization</span>
                  <span className="font-medium text-[#66bb6a]">Enabled</span>
                </div>
              </div>
            </div>

            <div className="text-white pt-6 flex items-center gap-1">
              <LocalGasStationIcon color="inherit" sx={{ fontSize: "16px" }} />
              <div className="text-gray-400 text-[12px]">
                {amountIsGreaterThanZero ? "< $ 0.01" : "-"}
              </div>
              {amountIsGreaterThanZero && (
                <Tooltip
                  text="This gas calculation is only an estimation. Your wallet will set the price of the
        transaction. You can modify the gas settings directly from your wallet provider."
                />
              )}
            </div>

            <button
              disabled={!amount || isPending}
              type="submit"
              className={`${
                !isPending && amountIsGreaterThanZero
                  ? "bg-white text-black cursor-pointer hover:bg-gray-300"
                  : "bg-gray-600 text-slate-500"
              } mt-12 py-2 w-full rounded-md flex gap-4 justify-center`}
            >
              {isPending && <Spinner />}
              {isPending
                ? "Supplying ETH"
                : amountIsGreaterThanZero
                ? "Supply ETH"
                : "Enter an amount"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
