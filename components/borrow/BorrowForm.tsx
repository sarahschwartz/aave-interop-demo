import { sendHashesForFinalization } from "@/utils/helpers";
import {
  getBorrowBundle,
  initWithdraw,
} from "@/utils/txns";
import { storeBorrowHashes } from "@/utils/storage";
import type { ViemClient, ViemSdk } from "@matterlabs/zksync-js/viem";
import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { UseAccountReturnType, type Config } from "wagmi";
import Spinner from "../ui/Spinner";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import Tooltip from "../ui/Tooltip";
import { formatEther, parseEther } from "viem";
import { writeContract } from "@wagmi/core";
import { config } from "@/utils/wagmi";
import { ErrorBox } from "@/components/ui/ErrorBox";
import BorrowSuccessForm from "./BorrowSuccessForm";
import { BlueInfoBox } from "../ui/BlueInfoBox";
import { ArrowNarrowRightIcon } from "@heroicons/react/solid";
import { SvgIcon } from "@mui/material";
import {
  computeProjectedHealthFactorAfterGhoBorrow,
  getHealthFactorColor,
} from "@/utils/aave";
import type { AaveData } from "@/utils/types";

type Props = {
  setShowBorrowModal: Dispatch<SetStateAction<boolean>>;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  sdk?: ViemSdk;
  client?: ViemClient;
  account: UseAccountReturnType<Config>;
  aaveData: AaveData;
  healthFactor?: number;
  ethPrice: number;
  shadowAccount: `0x${string}`;
};

const ArrowRightIcon = (
  <SvgIcon sx={{ fontSize: "14px", mx: 1, color: "white" }}>
    <ArrowNarrowRightIcon />
  </SvgIcon>
);

export default function GHOBorrowForm({
  setShowBorrowModal,
  setUpdateCount,
  sdk,
  client,
  account,
  aaveData,
  healthFactor,
  ethPrice,
  shadowAccount
}: Props) {
  const [amount, setAmount] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [hashes, setHashes] = useState<[`0x${string}`, `0x${string}`]>();
  const [gasEstimate, setGasEstimate] = useState<string>();
  // const [withdrawL1Gas, setWithdrawL1Gas] = useState<boolean>(true);

  const amountNumber = useMemo(
    () => Number(amount.replace(/,/g, "")) || 0,
    [amount]
  );

  const amountIsGreaterThanZero = amount && parseFloat(amount) > 0;

  const maxFormatted = parseFloat(
    formatEther(aaveData.maxAdditionalGho)
  ).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const newHealthFactor = () => {
    if (amount && parseFloat(amount) > 0) {
      const newHF = computeProjectedHealthFactorAfterGhoBorrow(
        aaveData,
        parseEther(amount)
      );
      return newHF;
    }
    return undefined;
  };

  function handleMax() {
    setAmount(formatEther(aaveData.maxAdditionalGho));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !sdk || !account || !client) {
      console.log(
        "missing amount, sdk, account, or client",
        amount,
        sdk,
        account,
        client
      );
      return;
    }
    setIsPending(true);

    try {
      const ghoAmount = parseEther(amount);
      const bundle = await getBorrowBundle(
        account,
        shadowAccount,
        ghoAmount,
        client
      );
      // withdraw gas for L1
      const wHash = await initWithdraw(
        account,
        bundle.l1GasNeeded,
        sdk,
        shadowAccount
      );
      // sign borrow bundle
      const bHash = await writeContract(config, bundle.bundle);

      if (!wHash || !bHash) {
        setIsError(true);
      } else {
        await sendHashesForFinalization(wHash, bHash);
        storeBorrowHashes(wHash, bHash, account.address!);
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
  async function handleChange(e: any) {
    try {
      const value =
        e.target.value > parseFloat(formatEther(aaveData.maxAdditionalGho))
          ? formatEther(aaveData.maxAdditionalGho)
          : e.target.value;
      setAmount(value);
      // if(!sdk || !client) return;
      // const ghoAmount = parseEther(value);
      // const bundle = await getBorrowBundle(account, shadowAccount, ghoAmount, client);
      // const withdrawGas = await getWithdrawEstimate(bundle.l1GasNeeded, sdk, shadowAccount);
      // const bundleGas = await estimateGas(config, {...bundle.bundle, chainId: zksyncOSTestnet.id});
      // const totalGas = withdrawGas + bundleGas;
      // const gasPrice = await client.l1.getGasPrice();
      // const totalWei = totalGas * gasPrice + bundle.l1GasNeeded;
      // const totalWei = withdrawL1Gas ? totalGas * gasPrice + bundle.l1GasNeeded : totalGas * gasPrice;
      // const ethCost = Number(formatEther(totalWei));
      // const usd = ethCost * ethPrice;
      // if(usd < 0.01){
      //   setGasEstimate("< $ 0.01");
      // } else {
      //   setGasEstimate("$ " + usd.toFixed(2));
      // }
      const response = await fetch("/api/get-price", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = await response.json();
      const price = json.ethPrice || ethPrice;
      setGasEstimate("$ " + (0.00135 * price + 0.03).toFixed(2));
    } catch (e) {
      console.log("Something wrong in amount input", e);
    }
  }

  return (
    <>
      {isError && <ErrorBox />}
      {isSuccess ? (
        <>
          {!hashes ? (
            <ErrorBox />
          ) : (
            <BorrowSuccessForm
              amount={amount}
              setShowSupplyModal={setShowBorrowModal}
              hashes={hashes}
            />
          )}
        </>
      ) : (
        <div>
          <div className="flex mb-4 align-bottom justify-between">
            <div className="text-[22px] font-bold mt-3">Borrow GHO</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/x.svg"
              alt="exit-form"
              className="cursor-pointer h-12 w-12"
              draggable={false}
              onClick={() => setShowBorrowModal(false)}
            />
          </div>
          <form onSubmit={handleSubmit} className="rounded-2xl text-slate-100">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <span className="text-sm font-medium">Amount</span>
              <Tooltip text="This is the total amount available for you to borrow. You can borrow based on your collateral and until the borrow cap is reached." />
            </div>

            <div className="rounded-sm border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-2">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={handleChange}
                  className="w-full bg-transparent text-xl tracking-tight outline-none placeholder:text-slate-500"
                  placeholder="0.00"
                  aria-label="Amount in GHO"
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
                    src="/gho.svg"
                    alt="GHO"
                    className="h-6 w-6"
                    draggable={false}
                  />
                  <span className="text-md font-semibold mr-2">GHO</span>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 pb-1 text-sm">
                <span className="text-slate-400">
                  ${" "}
                  {/* {amountNumber.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} */}
                  {amountNumber}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    Available {maxFormatted}
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

              <div className="rounded-sm border border-slate-700 text-sm  px-4 py-2">
                <div className="flex justify-between">
                  <div className="text-white">Health Factor</div>
                  <div className="flex items-center">
                    <span className={`${getHealthFactorColor(healthFactor)}`}>
                      {!healthFactor || healthFactor >= 1_000_000 ? (
                        <span className="text-xl font-bold">∞</span>
                      ) : (
                        <span>{healthFactor.toFixed(2)}</span>
                      )}
                    </span>
                    {newHealthFactor() && <span>{ArrowRightIcon}</span>}
                    {newHealthFactor && (
                      <span
                        className={`${getHealthFactorColor(newHealthFactor())}`}
                      >
                        {newHealthFactor()?.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="text-[10px]">Liquidation at {"<"}1.0</div>
                </div>
                {/* TODO: allow users with enough gas funds in shadow account on L1 to skip withdraw */}
                {/* {shadowAccountHasEnoughGas && (
                <div className='text-white mt-4'>
                  <div>
                  Withdraw 0.00135 ETH to L1 to pay for bridging?
                  <Tooltip text="The GHO you borrow will be automatically bridged back to this L2, which requires at least 0.00135 ETH on L1. If your shadow account already has this much ETH on L1, you can opt out of bridging." />
                  </div>
                  </div>
                )} */}
              </div>
            </div>

            <div className="text-white pt-6 flex items-center gap-1">
              <LocalGasStationIcon color="inherit" sx={{ fontSize: "16px" }} />
              <div className="text-gray-400 text-[12px]">
                {amountIsGreaterThanZero && gasEstimate ? gasEstimate : "-"}
              </div>
              {amountIsGreaterThanZero && (
                <Tooltip
                  text="This gas calculation is only an estimation. Your wallet will set the price of the
        transaction. You can modify the gas settings directly from your wallet provider. This includes the cost withdrawing ETH to L1 to pay for bridging the GHO back to the L2."
                />
              )}
            </div>

            <BlueInfoBox>
              <span className="font-bold">Attention:</span> Parameter changes
              via governance can alter your account health factor and risk of
              liquidation. Follow the{" "}
              <a
                target="_blank"
                href="https://governance.aave.com/"
                rel="noopener noreferrer"
                className="underline"
              >
                Aave governance forum
              </a>{" "}
              for updates.
            </BlueInfoBox>

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
                ? "Borrowing GHO"
                : amountIsGreaterThanZero
                ? "Borrow GHO"
                : "Enter an amount"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
