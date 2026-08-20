// インフラ層 - 開発用の暫定実装
// サーバー再起動やインスタンス複数化でデータが消える。
// 認証・永続化が整ったタイミングで quiz-catalog ドメイン + DB 実装に置き換える。
// Attempt はイミュータブル（変更のたびに新しいインスタンスを返す）なので、
// インスタンスをそのまま保持しても外部から書き換えられる心配はない。
import { injectable } from "inversify";
import type { Attempt } from "../domain/entities/attempt";
import type { AttemptStore } from "../domain/ports/attempt-store";

@injectable()
export class InMemoryAttemptStore implements AttemptStore {
  private readonly store = new Map<string, Attempt>();

  get(id: string): Attempt | null {
    return this.store.get(id) ?? null;
  }

  save(attempt: Attempt): void {
    this.store.set(attempt.id, attempt);
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}
