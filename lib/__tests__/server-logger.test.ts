// ログの出し分けの確認。
// 「想定内の失敗（warn・1行）」と「不具合（error・スタック付き）」を混ぜると、
// コンソールが業務エラーで埋まって不具合が見えなくなるため、ここが要点になる。
import { describe, it, expect, vi, afterEach } from "vitest";
import { AppError } from "../errors";
import { logServerError } from "../server-logger";

function captureConsole() {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  return {
    warn,
    error,
    warnText: () => warn.mock.calls.map((c) => String(c[0])).join("\n"),
    errorText: () => error.mock.calls.map((c) => String(c[0])).join("\n"),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logServerError", () => {
  it("想定内の AppError は warn に1行だけ出す", () => {
    const c = captureConsole();
    logServerError(
      "submitAnswerAction",
      new AppError("ALREADY_ANSWERED", "二度目の回答"),
    );

    expect(c.warn).toHaveBeenCalledTimes(1);
    expect(c.error).not.toHaveBeenCalled();
    expect(c.warnText()).toContain("submitAnswerAction");
    expect(c.warnText()).toContain("ALREADY_ANSWERED");
    expect(c.warnText()).toContain("二度目の回答");
  });

  it("INTERNAL_ERROR は AppError でも不具合として error に出す", () => {
    const c = captureConsole();
    logServerError(
      "getAttemptResult",
      new AppError("INTERNAL_ERROR", "選択肢のJSONが壊れています"),
    );

    expect(c.warn).not.toHaveBeenCalled();
    expect(c.errorText()).toContain("INTERNAL_ERROR");
  });

  it("AppError 以外はスタックまで出す", () => {
    const c = captureConsole();
    logServerError(
      "startGenerationAction",
      new TypeError("undefined is not a function"),
    );

    const text = c.errorText();
    expect(text).toContain("startGenerationAction");
    expect(text).toContain("TypeError: undefined is not a function");
    expect(text).toContain("server-logger.test.ts");
  });

  it("Error でない値も文字列にして出す", () => {
    const c = captureConsole();
    logServerError("someAction", "文字列が throw された");

    expect(c.errorText()).toContain("UnknownError: 文字列が throw された");
  });

  it("cause も辿って出す", () => {
    const c = captureConsole();
    logServerError(
      "loginAction",
      new Error("DB接続に失敗", { cause: new Error("ECONNREFUSED") }),
    );

    expect(c.errorText()).toContain("caused by: Error: ECONNREFUSED");
  });

  it("redirect() の例外は失敗ではないので何も出さない", () => {
    const c = captureConsole();
    const signal = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/login;307;",
    });
    logServerError("logoutAction", signal);

    expect(c.warn).not.toHaveBeenCalled();
    expect(c.error).not.toHaveBeenCalled();
  });
});
