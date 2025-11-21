/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inter } from "next/font/google";
import { http, useAccount, useChainId } from "wagmi";
import { NavItems } from "@/components/NavItems";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import SupplyAndBorrow from "@/components/SupplyAndBorrow";
import Stats from "@/components/Stats";
import { config, zksyncOSTestnet } from "@/utils/wagmi";
import ConnectButton from "@/components/ConnectButton";
import {
  createPublicClient,
  createWalletClient,
  custom,
  EIP1193Provider,
  formatEther,
} from "viem";
import {
  createViemClient,
  createViemSdk,
  type ViemClient,
  type ViemSdk,
} from "@dutterbutter/zksync-sdk/viem";
import { sepolia } from "viem/chains";
import { ConnectWalletPaper } from "@/components/ui/ConnectWalletPaper";
import { SvgIcon } from "@mui/material";
import { InformationCircleIcon } from "@heroicons/react/outline";
import {
  getShadowAccount,
} from "@/utils/txns";
import {
  getAaveBorrowsSummary,
  getAaveDepositSummary,
  getHashes,
} from "@/utils/storage";
import { getBalance } from "@wagmi/core";
import { computeCurrentHealthFactor, getFormattedETHUSD, getShadowAccountData } from "@/utils/aave";
import { AaveData } from "@/utils/types";
import { CONTRACT_ADDRESSES } from "@/utils/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function Home() {
  const account = useAccount();
  const currentChainId = useChainId();
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updateCount, setUpdateCount] = useState<number>(1);
  const [ethBalance, setEthBalance] = useState<string>();
  const [ghoBorrowed, setGhoBorrowed] = useState<string>('0.00');
  const [healthFactor, setHealthFactor] = useState<number>();
  const [aaveData, setAaveData] = useState<AaveData>();
  const [ethPrice, setEthPrice] = useState<number>();
  const [finalizingDeposits, setFinalizingDeposits] = useState<number>(0);
  const [finalizingBorrows, setFinalizingBorrows] = useState<number>(0);
  const [sdk, setSdk] = useState<ViemSdk>();
  const [client, setClient] = useState<ViemClient>();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const DEFAULT_L1_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
  const DEFAULT_L2_RPC = "https://zksync-os-testnet-alpha.zksync.dev/";

  const instantiateSdk = useCallback(
    async (addr: `0x${string}`, prov: EIP1193Provider, rpc: string) => {
      const transport = custom(prov);

      const l1Wallet = createWalletClient({
        account: addr,
        chain: sepolia,
        transport,
      });

      const l1Client = createPublicClient({
        chain: sepolia,
        transport: http(DEFAULT_L1_RPC),
      });

      const l2Public = createPublicClient({
        chain: zksyncOSTestnet,
        transport: http(rpc),
      });

      const l2Wallet = createWalletClient({
        account: addr,
        chain: zksyncOSTestnet,
        transport,
      });

      const client = createViemClient({
        l1: l1Client as any,
        l2: l2Public as any,
        l1Wallet: l1Wallet as any,
        l2Wallet: l2Wallet as any,
      } as any);
      const instance = createViemSdk(client);
      return { instance, client };
    },
    []
  );

  useEffect(() => {
    async function setupSdk() {
      if (!account || !account.connector || !account.connector.getProvider)
        return;
      const provider = (await account.connector.getProvider()) as
        | EIP1193Provider
        | undefined;
      if (!provider) {
        alert("No injected wallet found. Connect your wallet again.");
        return;
      }
      const { instance, client } = await instantiateSdk(
        account.address!,
        provider,
        DEFAULT_L2_RPC
      );
      setSdk(instance);
      setClient(client);
    }

    setupSdk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const usdValue = useMemo(
    () =>
      Math.round(parseFloat(ethBalance || "0.00") * (ethPrice || 3500) * 100) /
      100,
    [ethBalance, ethPrice]
  );

  useEffect(() => {
    async function checkStatus() {
      if (!hasMounted || !sdk || !account || !account.address || !client) return;
      setIsLoading(true);
      try {
      const price = await getFormattedETHUSD(client);
      setEthPrice(price);

      const shadowAccount = await getShadowAccount(client, account.address);
      const data = await getShadowAccountData(client, shadowAccount);
      setAaveData(data);

      if(!data){
        console.log("aave data missing");
        return;
      }

      const aTokenBalance = await getBalance(config, {
        address: shadowAccount,
        chainId: sepolia.id,
        token: CONTRACT_ADDRESSES.aToken,
      });

      const hashes = getHashes(account.address!);

      if(!hashes.borrows || hashes.borrows.length === 0){
          const borrowed = aaveData && aaveData.totalDebtBase ?  parseFloat((aaveData.totalDebtBase / BigInt(100_000_000)).toString()).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      ) : "0.00";
        setGhoBorrowed(borrowed);
      } else {
         const borrowSummary = await getAaveBorrowsSummary(
          sdk,
          account.address!,
          hashes.borrows,
          client
        );

        const finalizingAmount = borrowSummary.totalWeiFinalizing / BigInt(10_000_000_000);
        const borrowed = aaveData && aaveData.totalDebtBase ?  parseFloat(((aaveData.totalDebtBase + finalizingAmount) / BigInt(100_000_000)).toString()).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      ) : "0.00";
        setGhoBorrowed(borrowed);
        setFinalizingBorrows(borrowSummary.countFinalizing);
        
      }
      
      if (!hashes.deposits || hashes.deposits.length === 0) {
        setEthBalance(formatEther(aTokenBalance.value));
      } else {
      const depositSummary = await getAaveDepositSummary(
          sdk,
          account.address!,
          hashes.deposits,
          client
        );

        setEthBalance(formatEther(depositSummary.totalWeiFinalizing + aTokenBalance.value));
        setFinalizingDeposits(depositSummary.countFinalizing);
      }

      if(data.totalDebtBase > BigInt(0)){
        const hf = computeCurrentHealthFactor(data)
        setHealthFactor(hf)
      } else if (data.totalCollateralBase > BigInt(0)){
        setHealthFactor(1_000_000_000)
      }
      } catch (e) {
        console.log("ERROR:", e);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [sdk, client, hasMounted, updateCount, account]);

  return (
    <div className={`${inter.className} font-sans pb-12`}>
      <div className="border-b border-gray-700 flex align-middle gap-10 px-4">
        <div className="flex gap-2 mr-12">
          <Image src="aave.svg" alt="Aave logo" width={72} height={72} />
          <button className="bg-[#B6509E] hover:opacity-70 cursor-pointer text-white text-[10px] font-bold flex gap-0.5 items-center px-2 py-1 rounded-sm my-auto">
            TESTNET
            <SvgIcon sx={{ marginLeft: "2px", fontSize: "16px" }}>
              <InformationCircleIcon />
            </SvgIcon>
          </button>
        </div>
        <NavItems />
        <div className="w-full flex justify-end">
          <ConnectButton account={account} isMounted={hasMounted} />
        </div>
      </div>
      <div className="px-12">
        {account.isConnected && hasMounted ? (
          <>
            {currentChainId === zksyncOSTestnet.id ? (
              <div className="mt-12 mx-12">
                <Stats isLoading={isLoading} usdValue={usdValue} healthFactor={healthFactor} />
                <SupplyAndBorrow
                  finalizingBorrows={finalizingBorrows}
                  sdk={sdk}
                  client={client}
                  isLoading={isLoading}
                  finalizingDeposits={finalizingDeposits}
                  ethBalance={ethBalance || "0.00"}
                  setUpdateCount={setUpdateCount}
                  updateCount={updateCount}
                  ethPrice={ethPrice || 4000}
                  usdValue={usdValue}
                  account={account}
                  aaveData={aaveData}
                  healthFactor={healthFactor}
                  ghoBorrowed={ghoBorrowed}
                />
              </div>
            ) : (
              <div className="text-white flex justify-center mt-[200px]">
                Switch to ZKsync OS Testnet
              </div>
            )}
          </>
        ) : (
          <div className="mt-12 mx-12">
            <ConnectWalletPaper account={account} isMounted={hasMounted} />
          </div>
        )}
      </div>
    </div>
  );
}
