// インフラ層 - PasswordHasher ポートの実装
// Node 標準の scrypt（メモリハード関数）でパスワードをハッシュ化する。
// 外部依存を増やさずに、総当たり・GPU 攻撃に耐える方式を選んでいる。
//
// 保存形式: scrypt$N$r$p$<salt(base64)>$<hash(base64)>
// パラメータを一緒に保存しているため、将来コストを引き上げても
// 既存ユーザーのハッシュをそのまま照合できる。
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import {
  SCRYPT_BLOCK_SIZE,
  SCRYPT_COST,
  SCRYPT_KEY_LENGTH,
  SCRYPT_PARALLELIZATION,
  SCRYPT_SALT_BYTES,
} from "@/lib/constants";
import { injectable } from "inversify";
import type { RawPassword } from "../domain/entities/raw-password";
import type { PasswordHasher } from "../domain/ports/password-hasher";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const PREFIX = "scrypt";

// 既定パラメータでは N * r * 128 ≒ 16MB。maxmem はその2倍を確保しておく。
function maxmemFor(cost: number, blockSize: number): number {
  return 2 * 128 * cost * blockSize;
}

function derive(
  plain: string,
  salt: Buffer,
  cost: number,
  blockSize: number,
  parallelization: number,
  keyLength: number,
): Promise<Buffer> {
  return scryptAsync(plain, salt, keyLength, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: maxmemFor(cost, blockSize),
  });
}

@injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: RawPassword): Promise<string> {
    const salt = randomBytes(SCRYPT_SALT_BYTES);
    const derived = await derive(
      password.value,
      salt,
      SCRYPT_COST,
      SCRYPT_BLOCK_SIZE,
      SCRYPT_PARALLELIZATION,
      SCRYPT_KEY_LENGTH,
    );

    return [
      PREFIX,
      SCRYPT_COST,
      SCRYPT_BLOCK_SIZE,
      SCRYPT_PARALLELIZATION,
      salt.toString("base64"),
      derived.toString("base64"),
    ].join("$");
  }

  /**
   * 照合する。
   * 保存値が壊れている・空（ユーザーが存在しない場合のダミー照合）でも
   * 例外を投げずに false を返しつつ、同等の計算時間をかける。
   * 早期 return すると応答時間からアカウントの存在を推測されるため。
   */
  async verify(plain: string, hash: string): Promise<boolean> {
    const parsed = this.parse(hash);

    if (!parsed) {
      // 形式不正でも既定パラメータで1回計算し、時間差を作らない
      await derive(
        plain,
        randomBytes(SCRYPT_SALT_BYTES),
        SCRYPT_COST,
        SCRYPT_BLOCK_SIZE,
        SCRYPT_PARALLELIZATION,
        SCRYPT_KEY_LENGTH,
      );
      return false;
    }

    const derived = await derive(
      plain,
      parsed.salt,
      parsed.cost,
      parsed.blockSize,
      parsed.parallelization,
      parsed.expected.length,
    );

    if (derived.length !== parsed.expected.length) return false;
    return timingSafeEqual(derived, parsed.expected);
  }

  private parse(hash: string): {
    cost: number;
    blockSize: number;
    parallelization: number;
    salt: Buffer;
    expected: Buffer;
  } | null {
    const parts = hash.split("$");
    if (parts.length !== 6 || parts[0] !== PREFIX) return null;

    const cost = Number(parts[1]);
    const blockSize = Number(parts[2]);
    const parallelization = Number(parts[3]);
    if (
      !Number.isInteger(cost) ||
      !Number.isInteger(blockSize) ||
      !Number.isInteger(parallelization) ||
      cost <= 0 ||
      blockSize <= 0 ||
      parallelization <= 0
    ) {
      return null;
    }

    const salt = Buffer.from(parts[4], "base64");
    const expected = Buffer.from(parts[5], "base64");
    if (salt.length === 0 || expected.length === 0) return null;

    return { cost, blockSize, parallelization, salt, expected };
  }
}
