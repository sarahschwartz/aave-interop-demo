/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inter } from "next/font/google";
import { http, useAccount, useChainId } from "wagmi";
import { NavItems } from "@/components/NavItems";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import SupplyAndBorrow from "@/components/SupplyAndBorrow";
import Stats from "@/components/Stats";
import { zksyncOSTestnet } from "@/utils/wagmi";
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
  type ViemSdk,
} from "@dutterbutter/zksync-sdk/viem";
import { sepolia } from "viem/chains";
import { DepositRow, HashInfo, WithdrawalPhase } from "@/utils/types";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function Home() {
  const account = useAccount();
  const currentChainId = useChainId();
  const [hasMounted, setHasMounted] = useState(false);
  const [latestHashes, setLatestHashes] = useState<HashInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updateCount, setUpdateCount] = useState<number>(1);
  const [ethBalance, setEthBalance] = useState<string>();
  // TODO: fetch actual price
  // const [ethPrice, setEthPrice] = useState<number>();
  const ethPrice = 3400.00;
  const [finalizingDeposits, setFinalizingDeposits] = useState<DepositRow[]>();
  const [sdk, setSdk] = useState<ViemSdk>();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const DEFAULT_L1_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
  const DEFAULT_L2_RPC = "https://zksync-os-testnet-alpha.zksync.dev/";

  const l1Client = createPublicClient({
    chain: sepolia,
    transport: http(DEFAULT_L1_RPC),
  });

  const instantiateSdk = useCallback(
    async (addr: `0x${string}`, prov: EIP1193Provider, rpc: string) => {
      const transport = custom(prov);

      const l1Wallet = createWalletClient({
        account: addr,
        chain: sepolia,
        transport,
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
      return instance;
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
      const instance = await instantiateSdk(
        account.address!,
        provider,
        DEFAULT_L2_RPC
      );
      setSdk(instance);
    }

    setupSdk();
  }, [account]);

  useEffect(() => {
    async function checkStatus() {
      if (!hasMounted || !sdk) return;
      setIsLoading(true);
      const hashes = localStorage.getItem("latestAaveZKsyncDeposits");
      if (!hashes) {
        setIsLoading(false);
        console.log("no hashes");
        return;
      }

      try {
        const json = JSON.parse(hashes);
        console.log("latest Hashes:", json);
        setLatestHashes(json);

        const client = createPublicClient({
          chain: zksyncOSTestnet,
          transport: http(),
        });

        const [txs, phases] = await Promise.all([
          Promise.allSettled(
            json.map((hash: `0x${string}`) => client.getTransaction({ hash }))
          ),
          Promise.allSettled(
            json.map((hash: `0x${string}`) => sdk.withdrawals.status(hash))
          ),
        ]);

        const rows: DepositRow[] = json.map(
          (hash: `0x${string}`, i: number) => {
            const txR = txs[i];
            const stR = phases[i];

            const valueWei =
              txR.status === "fulfilled" && txR.value
                ? txR.value.value ?? BigInt(0)
                : BigInt(0);
            const phase =
              stR.status === "fulfilled"
                ? stR.value.phase
                : ("PENDING" as WithdrawalPhase);

            return {
              hash,
              valueWei,
              valueEth: formatEther(valueWei),
              phase,
            };
          }
        );

        const totalWei = rows.reduce((acc, r) => acc + r.valueWei, BigInt(0));
        const anyFinalizing = rows.filter((r) => r.phase !== "FINALIZED");

        console.log("total eth:", formatEther(totalWei));
        console.log("anyFinalizing:", anyFinalizing);

        setEthBalance(formatEther(totalWei));
        setFinalizingDeposits(anyFinalizing);
      } catch (e) {
        console.log("ERROR:", e);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [sdk, hasMounted, updateCount]);

  return (
    <div className={`${inter.className} font-sans`}>
      <div className="border-b border-gray-700 flex align-middle gap-10 px-4">
        <Image src="aave.svg" alt="Aave logo" width={72} height={72} />
        <NavItems />
        <div className="w-full flex justify-end">
          <ConnectButton account={account} isMounted={hasMounted} />
        </div>
      </div>
      <div>
        {account.isConnected && hasMounted && (
          <>
            {currentChainId === zksyncOSTestnet.id ? (
              <div className="mt-12 mx-12">
                <Stats isLoading={isLoading} ethBalance={ethBalance ?? '0.00'} priceUsd={ethPrice} />
                <SupplyAndBorrow
                  sdk={sdk}
                  isLoading={isLoading}
                  latestHashes={latestHashes}
                  finalizingDeposits={finalizingDeposits ?? []}
                  ethBalance={ethBalance ?? "0.00"}
                  setUpdateCount={setUpdateCount}
                  updateCount={updateCount}
                />
              </div>
            ) : (
              <div className="text-white flex justify-center mt-[200px]">
                Switch to ZKsync OS Testnet
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
