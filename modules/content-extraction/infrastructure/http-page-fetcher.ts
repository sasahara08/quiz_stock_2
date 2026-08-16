// インフラ層 - HTTP フェッチャー
// URL を受け取り HTML 文字列を返す。
// redirect: "manual" でリダイレクトを自前で追跡し、
// 各ホップで SSRF ガードを通すことでリダイレクト先の安全も保証する。
// タイムアウトは AbortController で制御し、最大リダイレクト数を超えたらエラー。
import { FETCH_TIMEOUT_MS, MAX_REDIRECTS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { validateSsrf } from "../domain/rules/ssrf-guard";

export async function fetchPage(startUrl: string): Promise<string> {
  let currentUrl = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl);
    await validateSsrf(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "QuizStack/1.0 (content-extractor)" },
      });
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === "AbortError") {
        throw new AppError("FETCH_FAILED", "Request timed out");
      }
      throw new AppError(
        "FETCH_FAILED",
        `Fetch error: ${(err as Error).message}`,
      );
    }
    clearTimeout(timer);

    if (response.status >= 300 && response.status < 400) {
      if (hop === MAX_REDIRECTS) {
        throw new AppError("FETCH_FAILED", "Too many redirects");
      }
      const location = response.headers.get("location");
      if (!location) {
        throw new AppError("FETCH_FAILED", "Redirect with no Location header");
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!response.ok) {
      throw new AppError("FETCH_FAILED", `HTTP ${response.status}`);
    }

    return await response.text();
  }

  throw new AppError("FETCH_FAILED", "Too many redirects");
}
