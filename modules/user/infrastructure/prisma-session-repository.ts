// インフラ層 - SessionRepository ポートの実装（Prisma / SQLite）
// 保存するのはトークンのハッシュのみ。平文トークンはここへ渡ってこない。
import { injectable } from "inversify";
import { prisma } from "@/lib/prisma";
import { Session } from "../domain/entities/session";
import type { SessionRepository } from "../domain/ports/session-repository";

@injectable()
export class PrismaSessionRepository implements SessionRepository {
  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const row = await prisma.session.findUnique({ where: { tokenHash } });
    return row ? Session.fromSnapshot(row) : null;
  }

  async save(session: Session): Promise<void> {
    const snapshot = session.toSnapshot();
    await prisma.session.upsert({
      where: { id: snapshot.id },
      create: snapshot,
      update: { expiresAt: snapshot.expiresAt },
    });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await prisma.session.deleteMany({ where: { tokenHash } });
  }

  async deleteExpired(now: Date): Promise<void> {
    await prisma.session.deleteMany({ where: { expiresAt: { lte: now } } });
  }
}
