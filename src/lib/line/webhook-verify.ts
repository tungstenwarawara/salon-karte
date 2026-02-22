import { createHmac, timingSafeEqual } from "crypto";

// LINE Webhook署名検証（HMAC-SHA256）
export function verifyLineSignature(
  channelSecret: string,
  body: string,
  signature: string
): boolean {
  const hash = createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");
  const expected = Buffer.from(hash);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
