// ドメイン層 - ポート（インターフェース）
// ダッシュボードに出す学習状況の取得元の抽象。
//
// 現在はモック実装がバインドされている。将来 quiz-catalog と回答履歴が
// DBに載ったら、Prisma で集計する実装を追加して container.ts の
// bind 先を差し替えるだけでよい。
import type { Dashboard } from "../entities/dashboard";

export interface DashboardRepository {
  loadDashboard(userId: string): Promise<Dashboard>;
}
