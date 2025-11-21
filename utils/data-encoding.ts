import { concatHex, encodeAbiParameters, keccak256, type Hex } from "viem";

export function encodeNTVAssetId(
  chainId: bigint,
  tokenAddress: Hex,
): Hex {
  const L2_NATIVE_TOKEN_VAULT_ADDR = "0x0000000000000000000000000000000000010004";
  const encoded = encodeAbiParameters(
    [{ type: "uint256" }, { type: "address" }, { type: "address" }],
    [chainId, L2_NATIVE_TOKEN_VAULT_ADDR, tokenAddress]
  );

  return keccak256(encoded);
}

export function encodeBridgeBurnData(
  amount: bigint,
  remoteReceiver: Hex,
  maybeTokenAddress: Hex
): Hex {
  return encodeAbiParameters(
    [{ type: "uint256" }, { type: "address" }, { type: "address" }],
    [amount, remoteReceiver, maybeTokenAddress]
  );
}

export function encodeAssetRouterBridgehubDepositData(
  assetId: Hex, // bytes32
  transferData: Hex, // encoded bytes
): Hex {
  const ENCODING_VERSION = "0x01";
  const encodedInner = encodeAbiParameters(
    [{ type: "bytes32" }, { type: "bytes" }],
    [assetId, transferData]
  );

  return concatHex([ENCODING_VERSION, encodedInner]);
}

export const DataEncoding = {
  encodeNTVAssetId,
  encodeBridgeBurnData,
  encodeAssetRouterBridgehubDepositData,
};
