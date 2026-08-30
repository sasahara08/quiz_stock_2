// ドメイン層 - ポート（インターフェース）
// Attempt の永続化の抽象。ユースケースはこのインターフェースにのみ依存し、
// 具体的な実装（DB / メモリ）を知らない。
// やり取りするのはエンティティそのもの。DB 実装が必要とする
// プレーンデータへの変換は Attempt.toSnapshot / fromSnapshot が担う。
import type { Attempt } from "../entities/attempt";

export interface AttemptStore {
  get(id: string): Promise<Attempt | null>;
  save(attempt: Attempt): Promise<void>;
  delete(id: string): Promise<void>;
}
