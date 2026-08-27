// ユースケース層
// ダッシュボードの学習状況を取得する。
// 集計値の妥当性は各エンティティが生成時に保証するため、
// このクラスはポートを呼ぶだけの薄い調整に留まる。
import { inject, injectable } from "inversify";
import type { Dashboard } from "../domain/entities/dashboard";
import type { DashboardRepository } from "../domain/ports/dashboard-repository";
import { ANALYTICS_TYPES } from "../domain/types";

@injectable()
export class GetDashboardUseCase {
  constructor(
    @inject(ANALYTICS_TYPES.DashboardRepository)
    private readonly repository: DashboardRepository,
  ) {}

  execute(userId: string): Promise<Dashboard> {
    return this.repository.loadDashboard(userId);
  }
}
