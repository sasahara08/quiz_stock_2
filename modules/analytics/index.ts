// analytics モジュールの公開 API
// 他モジュールや app/ はこのファイルからのみ import する。
// サーバー側（RSC / Server Component）向けの公開 API。
// 'use client' なコンポーネントからは import しないこと。
// サーバー専用の依存（DIコンテナ経由の Prisma など）がブラウザ側の
// バンドルに引き込まれてしまう（このモジュールにクライアント向けのAPIはない）。
export { getDashboardData } from "./api/get-dashboard-data";
export { analyticsContainerModule } from "./container";
export type {
  DashboardView,
  MonthlyStudyView,
  StudyCellView,
  AttemptSummaryView,
} from "./api/get-dashboard-data";
