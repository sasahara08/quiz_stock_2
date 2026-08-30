// DI コンポジション（モジュール単位）
// ポート（DashboardRepository）と実装をここでのみ結び付ける。
// モックが必要になったら bind 先を戻すだけでよい。
import "reflect-metadata";
import { ContainerModule } from "inversify";
import { ANALYTICS_TYPES } from "./domain/types";
import { PrismaDashboardRepository } from "./infrastructure/prisma-dashboard-repository";
import { GetDashboardUseCase } from "./use-cases/get-dashboard";

export const analyticsContainerModule = new ContainerModule(({ bind }) => {
  bind(ANALYTICS_TYPES.DashboardRepository)
    .to(PrismaDashboardRepository)
    .inSingletonScope();
  bind(GetDashboardUseCase).toSelf().inSingletonScope();
});
