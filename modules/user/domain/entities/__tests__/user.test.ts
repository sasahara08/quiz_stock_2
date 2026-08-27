// User と RawPassword が登録時の不変条件を守っていることを確認するテスト。
import { describe, it, expect } from "vitest";
import { MAX_USER_NAME_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/constants";
import { AppError, type ErrorCode } from "@/lib/errors";
import { RawPassword } from "../raw-password";
import { User } from "../user";

function expectAppError(fn: () => unknown, code: ErrorCode): void {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe(code);
    return;
  }
  throw new Error(`AppError(${code}) が投げられませんでした`);
}

describe("User.register", () => {
  it("メールアドレスを正規化して保持する", () => {
    const user = User.register({
      name: "テスト太郎",
      email: "  Foo@Example.COM  ",
      passwordHash: "hashed",
    });
    expect(user.email).toBe("foo@example.com");
  });

  it("ユーザー名の前後の空白を除去する", () => {
    const user = User.register({
      name: "  テスト太郎  ",
      email: "foo@example.com",
      passwordHash: "hashed",
    });
    expect(user.name).toBe("テスト太郎");
  });

  it("ユーザー名が空なら登録できない", () => {
    expectAppError(
      () =>
        User.register({ name: "   ", email: "foo@example.com", passwordHash: "h" }),
      "INVALID_USER_NAME",
    );
  });

  it("ユーザー名が長すぎると登録できない", () => {
    expectAppError(
      () =>
        User.register({
          name: "あ".repeat(MAX_USER_NAME_LENGTH + 1),
          email: "foo@example.com",
          passwordHash: "h",
        }),
      "INVALID_USER_NAME",
    );
  });

  it.each(["foo", "foo@", "@example.com", "foo bar@example.com", "foo@example"])(
    "不正なメールアドレス（%s）では登録できない",
    (email) => {
      expectAppError(
        () => User.register({ name: "テスト", email, passwordHash: "h" }),
        "INVALID_EMAIL",
      );
    },
  );
});

describe("User#toPublic", () => {
  it("passwordHash を含まない", () => {
    const user = User.register({
      name: "テスト太郎",
      email: "foo@example.com",
      passwordHash: "super-secret-hash",
    });
    const publicUser = user.toPublic();

    expect(Object.keys(publicUser).sort()).toEqual(["email", "id", "name"]);
    expect(JSON.stringify(publicUser)).not.toContain("super-secret-hash");
  });
});

describe("RawPassword.create", () => {
  it("ポリシーを満たすパスワードを受け入れる", () => {
    expect(RawPassword.create("correct-horse").value).toBe("correct-horse");
  });

  it("短すぎるパスワードを拒否する", () => {
    expectAppError(
      () => RawPassword.create("a".repeat(MIN_PASSWORD_LENGTH - 1)),
      "WEAK_PASSWORD",
    );
  });

  it("空白のみのパスワードを拒否する", () => {
    expectAppError(() => RawPassword.create("          "), "WEAK_PASSWORD");
  });

  it("文字列化しても平文が漏れない", () => {
    const password = RawPassword.create("correct-horse");
    expect(`${password}`).not.toContain("correct-horse");
    expect(JSON.stringify({ password })).not.toContain("correct-horse");
  });
});
