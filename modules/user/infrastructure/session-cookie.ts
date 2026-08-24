// インフラ層 - セッションクッキーの読み書き
// Next.js の Cookie API に依存するため、presentation / api 層からのみ使う。
// ドメイン層とユースケース層はトークン文字列だけを扱い、Cookie を知らない。
//
// httpOnly: JavaScript から読めないようにし、XSS でのトークン窃取を防ぐ
// sameSite lax: 外部サイトからの POST に Cookie を送らない（CSRF 対策）
// secure: 本番では HTTPS 以外で送信させない
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from "@/lib/constants";

const MAX_AGE_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function writeSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
