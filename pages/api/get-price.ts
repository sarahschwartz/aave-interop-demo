/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";

const TWO_MINUTES = 2 * 60 * 1000;

type Cache = { price?: number; ts?: number };
const g = globalThis as typeof globalThis & { __ETH_PRICE_CACHE__?: Cache };
g.__ETH_PRICE_CACHE__ ||= {};
const CACHE = g.__ETH_PRICE_CACHE__;

async function fetchEthPrice(): Promise<number> {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error("Missing ALCHEMY_API_KEY");

  const r = await fetch(
    `https://api.g.alchemy.com/prices/v1/${key}/tokens/by-symbol?symbols=ETH`
  );
  if (!r.ok) throw new Error(`Alchemy ${r.status} ${r.statusText}`);

  const json = await r.json();
  const price = json?.data?.[0]?.prices?.[0]?.value;
  if (typeof price !== "string") throw new Error("Price not found");
  return parseFloat(price);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const fresh = CACHE.ts && Date.now() - CACHE.ts < TWO_MINUTES;

  if (fresh && typeof CACHE.price === "number") {
    return res.status(200).json({ ok: true, ethPrice: CACHE.price, cached: true });
  }

  try {
    const price = await fetchEthPrice();
    CACHE.price = price;
    CACHE.ts = Date.now();
    return res.status(200).json({ ok: true, ethPrice: price, cached: false });
  } catch (e: any) {
    if (typeof CACHE.price === "number") {
      return res.status(200).json({ ok: true, ethPrice: CACHE.price, cached: true, stale: true });
    }
    return res.status(500).json({ ok: false, error: e?.message ?? "Failed to fetch price" });
  }
}
