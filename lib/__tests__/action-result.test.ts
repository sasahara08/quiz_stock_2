// 例外が ActionResult に変換されるときの決まりごと。
// 例外の message をそのままクライアントに返してしまうと内部の事情が漏れるため、
// 外に出るのは errorMessages の文言だけ、という点を固定する。
import { describe, it, expect, vi, afterEach } from "vitest";
import { failure, failureOf } from "../action-result";
import { AppError, errorMessages } from "../errors";

afterEach(() => {
  vi.restoreAllMocks();
});

function silenceConsole() {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
}

describe("failure", () => {
  it("AppError のコードを引き継ぎ、文言は errorMessages を使う", () => {
    silenceConsole();
    const result = failure(
      "startReviewAction",
      new AppError("NO_REVIEW_TARGET", "対象0件"),
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: "NO_REVIEW_TARGET",
        message: errorMessages.NO_REVIEW_TARGET,
      },
    });
  });

  it("AppError 以外は INTERNAL_ERROR に丸め、例外の message は外に出さない", () => {
    silenceConsole();
    const result = failure(
      "startGenerationAction",
      new Error("postgres://user:pw@host"),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("INTERNAL_ERROR");
    expect(result.error.message).toBe(errorMessages.INTERNAL_ERROR);
    expect(result.error.message).not.toContain("postgres");
  });

  it("必ずコンソールに記録する", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    failure("loginAction", new Error("想定外"));

    expect(spy).toHaveBeenCalled();
  });
});

describe("failureOf", () => {
  it("例外を伴わない失敗も記録したうえで返す", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = failureOf(
      "loginAction",
      "INVALID_CREDENTIALS",
      "schema 不一致",
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: errorMessages.INVALID_CREDENTIALS,
      },
    });
    // 詳細はコンソール側にだけ残る
    expect(String(spy.mock.calls[0]?.[0])).toContain("schema 不一致");
  });
});
