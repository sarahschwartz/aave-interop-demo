import { GRADIENT } from "@/utils/constants";
import {
  Config,
  injected,
  UseAccountReturnType,
  useConnect,
  useDisconnect,
} from "wagmi";

export default function ConnectButton({
  account,
  isMounted,
}: {
  account: UseAccountReturnType<Config>;
  isMounted: boolean;
}) {
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  function handleClick() {
    if (account.isConnected) {
      disconnect();
    } else {
      connect({ connector: injected() });
    }
  }

  return (
    <>
      {isMounted && (
        <button
          style={!account.isConnected ? { background: GRADIENT } : {}}
          className={`${
            account.isConnected ? "bg-gray-700 hover:bg-gray-900" : ""
          } flex gap-2 text-sm cursor-pointer rounded-sm text-white py-2 px-3 m-1`}
          onClick={handleClick}
        >
          {account.isConnected && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/avatar.svg"
                alt="avatar"
                className="h-5 w-5 rounded-full"
                draggable={false}
              />
            </div>
          )}
          <span>{account.isConnected ? "Disconnect" : "Connect wallet"}</span>
        </button>
      )}
    </>
  );
}
