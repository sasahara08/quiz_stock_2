// DI コンポジション（モジュール単位）
// ポート（DashboardRepository）と実装（MockDashboardRepository）をここでのみ結び付ける。
// 実データ集計に差し替える際はこのファイルの bind 先を変更するだけでよい。
import "reflect-metadata";
import { ContainerModule } from "inversify";
import { ANALYTICS_TYPES } from "./domain/types";
import { MockDashboardRepository } from "./infrastructure/mock-dashboard-repository";
import { GetDashboardUseCase } from "./use-cases/get-dashboard";

export const analyticsContainerModule = new ContainerModule(({ bind }) => {
  bind(ANALYTICS_TYPES.DashboardRepository)
    .to(MockDashboardRepository)
    .inSingletonScope();
  bind(GetDashboardUseCase).toSelf().inSingletonScope();
});
