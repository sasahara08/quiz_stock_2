// DI コンポジションルート
// アプリ全体で共有する唯一の InversifyJS コンテナ。
// 各モジュールの container.ts（ContainerModule）をここで束ねる。
// Next.js の dev サーバーは HMR でモジュールが再評価されるため、
// prisma クライアントと同様 globalThis にキャッシュしてコンテナを使い回す。
import "reflect-metadata";
import { Container } from "inversify";
// 各モジュールの container.ts を直接 import する（index.ts 経由にしない）。
// index.ts は actions/api も re-export しており、それらは本ファイル（container）に
// 依存するため、index.ts 経由だと循環 import になってしまう。
import { analyticsContainerModule } from "@/modules/analytics/container";
import { contentExtractionContainerModule } from "@/modules/content-extraction/container";
import { quizCatalogContainerModule } from "@/modules/quiz-catalog/container";
import { quizGenerationContainerModule } from "@/modules/quiz-generation/container";
import { quizSessionContainerModule } from "@/modules/quiz-session/container";
import { userContainerModule } from "@/modules/user/container";

function createContainer(): Container {
  const container = new Container();
  container.load(
    analyticsContainerModule,
    contentExtractionContainerModule,
    quizCatalogContainerModule,
    quizGenerationContainerModule,
    quizSessionContainerModule,
    userContainerModule,
  );
  return container;
}

const globalForContainer = globalThis as unknown as { diContainer?: Container };

export const container = globalForContainer.diContainer ?? createContainer();

if (process.env.NODE_ENV !== "production") globalForContainer.diContainer = container;
