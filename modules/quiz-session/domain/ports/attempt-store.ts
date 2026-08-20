// ドメイン層 - ポート（インターフェース）
// Attempt の永続化の抽象。ユースケースはこのインターフェースにのみ依存し、
// 具体的な実装（メモリ / DB）を知らない。
// やり取りするのはエンティティそのもの。DB 実装が必要とする
// プレーンデータへの変換は Attempt.toSnapshot / fromSnapshot が担う。
import type { Attempt } from "../entities/attempt";

export interface AttemptStore {
  get(id: string): Attempt | null;
  save(attempt: Attempt): void;
  delete(id: string): void;
}
