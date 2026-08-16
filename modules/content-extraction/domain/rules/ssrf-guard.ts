// ドメイン層 - ルール
// SSRF（Server-Side Request Forgery）攻撃を防ぐためのガード。
// ユーザーが入力した URL をサーバーがフェッチする際、
// プライベート IP・ループバック・リンクローカル・クラウドメタデータへの
// アクセスをブロックする。リダイレクト先にも毎ホップ適用される。
import dns from "node:dns/promises";
import net from "node:net";
import { AppError } from "@/lib/errors";

// ビット長で表現することで 172.16/12 のような端数マスクにも対応できる
const PRIVATE_RANGES_V4: Array<{ prefix: number[]; bits: number }> = [
  { prefix: [10], bits: 8 },
  { prefix: [172, 16], bits: 12 },
  { prefix: [192, 168], bits: 16 },
  { prefix: [127], bits: 8 },
  { prefix: [169, 254], bits: 16 },
  { prefix: [0], bits: 8 },
];

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd"))
      return true;
    if (normalized.startsWith("fe80")) return true;
    return false;
  }

  if (!net.isIPv4(ip)) return false;

  const octets = ip.split(".").map(Number);

  for (const range of PRIVATE_RANGES_V4) {
    const { prefix, bits } = range;
    const prefixOctets = Math.ceil(bits / 8);
    let match = true;
    for (let i = 0; i < prefixOctets; i++) {
      if (i < prefix.length) {
        if (bits % 8 !== 0 && i === prefixOctets - 1) {
          const mask = 0xff & (0xff << (8 - (bits % 8)));
          if ((octets[i] & mask) !== (prefix[i] & mask)) {
            match = false;
            break;
          }
        } else {
          if (octets[i] !== prefix[i]) {
            match = false;
            break;
          }
        }
      }
    }
    if (match) return true;
  }

  return false;
}

// ホスト名を DNS 解決し、解決後の全 IP が安全かを検証する。
// ホスト名がすでに IP アドレス文字列の場合は DNS 解決をスキップする。
// DNS 解決失敗もブロック対象とする（存在しないホストへの到達を防ぐため）。
export async function validateSsrf(hostname: string): Promise<void> {
  let ips: string[];

  if (net.isIP(hostname) !== 0) {
    ips = [hostname];
  } else {
    try {
      ips = await dns.resolve4(hostname);
    } catch {
      throw new AppError("FORBIDDEN_URL", `DNS resolution failed: ${hostname}`);
    }
  }

  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      throw new AppError(
        "FORBIDDEN_URL",
        `Access to private/reserved IP is forbidden: ${ip}`,
      );
    }
  }
}
