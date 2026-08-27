// インフラ層 - UserRepository ポートの実装（Prisma / SQLite）
import { injectable } from "inversify";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { User } from "../domain/entities/user";
import type { UserRepository } from "../domain/ports/user-repository";

/** Prisma のユニーク制約違反 */
const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

function isUniqueConstraintViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === UNIQUE_CONSTRAINT_VIOLATION
  );
}

@injectable()
export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? User.fromSnapshot(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? User.fromSnapshot(row) : null;
  }

  async create(user: User): Promise<void> {
    try {
      await prisma.user.create({ data: user.toSnapshot() });
    } catch (err) {
      // メールアドレスの一意性を最終的に保証しているのはこの制約。
      // 事前確認と登録の間に別リクエストが割り込んだ場合もここで弾かれる。
      if (isUniqueConstraintViolation(err)) {
        throw new AppError(
          "EMAIL_ALREADY_REGISTERED",
          "このメールアドレスはすでに登録されています",
        );
      }
      throw err;
    }
  }
}
