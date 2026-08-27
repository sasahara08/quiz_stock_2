// パスワードのハッシュ化と照合が正しく動くことを確認するテスト。
import { describe, it, expect } from "vitest";
import { RawPassword } from "../../domain/entities/raw-password";
import { ScryptPasswordHasher } from "../scrypt-password-hasher";

const hasher = new ScryptPasswordHasher();

describe("ScryptPasswordHasher", () => {
  it("平文をそのまま保存しない", async () => {
    const hash = await hasher.hash(RawPassword.create("correct-horse"));
    expect(hash).not.toContain("correct-horse");
    expect(hash.startsWith("scrypt$")).toBe(true);
  });

  it("同じパスワードでも毎回異なるハッシュになる（ソルトが効いている）", async () => {
    const password = RawPassword.create("correct-horse");
    const a = await hasher.hash(password);
    const b = await hasher.hash(password);
    expect(a).not.toBe(b);
  });

  it("正しいパスワードを受け入れる", async () => {
    const hash = await hasher.hash(RawPassword.create("correct-horse"));
    await expect(hasher.verify("correct-horse", hash)).resolves.toBe(true);
  });

  it("誤ったパスワードを拒否する", async () => {
    const hash = await hasher.hash(RawPassword.create("correct-horse"));
    await expect(hasher.verify("correct-horsf", hash)).resolves.toBe(false);
    await expect(hasher.verify("", hash)).resolves.toBe(false);
  });

  it("マルチバイト文字を含むパスワードも照合できる", async () => {
    const hash = await hasher.hash(RawPassword.create("ぱすわーど１２３"));
    await expect(hasher.verify("ぱすわーど１２３", hash)).resolves.toBe(true);
    await expect(hasher.verify("ぱすわーど１２４", hash)).resolves.toBe(false);
  });

  it.each(["", "not-a-hash", "scrypt$broken", "scrypt$0$8$1$c2FsdA==$aGFzaA=="])(
    "壊れた保存値（%s）でも例外を投げず false を返す",
    async (hash) => {
      await expect(hasher.verify("correct-horse", hash)).resolves.toBe(false);
    },
  );
});
