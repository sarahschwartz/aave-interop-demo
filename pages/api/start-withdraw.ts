import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { hash } = req.body;
  console.log("started withdraw for " + hash);

  const targetUrl = `http://${req.headers.host}/api/finalize-withdraw`;
  const fetchURL = `${process.env.QSTASH_URL}/v2/publish/${targetUrl}`;

  const r = await fetch(fetchURL, {
    method: "POST",
    headers: {
      ...(process.env.QSTASH_TOKEN
        ? { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` }
        : {}),
      "Content-Type": "application/json",
      "Upstash-Delay": "6m",
    },
    body: JSON.stringify({ hash }),
  });

  if (!r.ok) return res.status(500).json({ ok: false, error: await r.text() });
  res.status(202).json({ ok: true });
}
