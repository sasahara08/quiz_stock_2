// 環境変数の読み取り。
// 綴り間違いを黙って既定値に丸めると、本実装のつもりでモックが動き続ける。
// 解釈できない値を例外にしている点がこのモジュールの要点。
import { describe, it, expect, afterEach } from "vitest";
import { AppError } from "../errors";
import { readBooleanEnv } from "../env";

const NAME = "TEST_FLAG_FOR_UNIT";

afterEach(() => {
  delete process.env[NAME];
});

describe("readBooleanEnv", () => {
  it("未設定なら fallback を返す", () => {
    expect(readBooleanEnv(NAME, false)).toBe(false);
    expect(readBooleanEnv(NAME, true)).toBe(true);
  });

  it("空文字も未設定として扱う", () => {
    process.env[NAME] = "   ";
    expect(readBooleanEnv(NAME, false)).toBe(false);
  });

  it.each(["true", "TRUE", "1", "yes", "on", " true "])(
    "%s は true として読む",
    (value) => {
      process.env[NAME] = value;
      expect(readBooleanEnv(NAME, false)).toBe(true);
    },
  );

  it.each(["false", "FALSE", "0", "no", "off"])(
    "%s は false として読む",
    (value) => {
      process.env[NAME] = value;
      expect(readBooleanEnv(NAME, true)).toBe(false);
    },
  );

  it("解釈できない値は fallback に倒さず例外にする", () => {
    process.env[NAME] = "ture"; // 綴り間違いを想定
    try {
      readBooleanEnv(NAME, false);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe("VALIDATION_ERROR");
      expect((err as AppError).message).toContain(NAME);
      return;
    }
    throw new Error("例外が投げられませんでした");
  });
});
