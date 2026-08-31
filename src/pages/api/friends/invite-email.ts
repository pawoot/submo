import type { NextApiRequest, NextApiResponse } from "next";

const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.submo.ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Email provider is not configured" });

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  // Validate the caller through the Data API before allowing a mail send.
  // The profile policy returns a row only for the authenticated owner.
  const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;
  if (!dataApiUrl) return res.status(503).json({ error: "Data API is not configured" });
  const identity = await fetch(`${dataApiUrl}/profiles?select=id&limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const profiles = identity.ok ? await identity.json() : [];
  if (!Array.isArray(profiles) || profiles.length !== 1) return res.status(401).json({ error: "Unauthorized" });

  const { email, inviterName } = req.body || {};
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Invalid email" });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "Submo <onboarding@resend.dev>",
      to: [email.trim().toLowerCase()],
      subject: `${inviterName || "เพื่อนของคุณ"} ชวนคุณเชื่อมต่อใน Submo`,
      html: `<main style="font-family:Arial,sans-serif;color:#111827"><h1>คุณได้รับคำเชิญเป็นเพื่อนใน Submo</h1><p>${escapeHtml(inviterName || "เพื่อนของคุณ")} อยากแชร์ภาพรวมค่าใช้จ่ายกับคุณ</p><p>คุณจะเห็นเฉพาะยอดรวมและหมวดหมู่ที่เพื่อนอนุญาตเท่านั้น ไม่เห็นชื่อบริการ วันต่ออายุ หรือข้อมูลการชำระเงิน</p><p><a href="${appUrl}/friends" style="display:inline-block;background:#4f46e5;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">ดูคำเชิญใน Submo</a></p></main>`,
    }),
  });
  if (!response.ok) return res.status(502).json({ error: "Email delivery failed" });
  return res.status(200).json({ delivered: true });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] || character));
}
