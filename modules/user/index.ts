// user モジュールの公開 API
// 他モジュールや app/ はこのファイルからのみ import する。
// User エンティティそのものは公開しない（passwordHash を外へ出さないため）。
// 外部が受け取れるのは PublicUser（id / name / email）のみ。
// サーバー側（RSC / Server Component / 他モジュールのサーバーコード）向けの公開 API。
// 'use client' なコンポーネントからは import しないこと。
// サーバー専用の依存（DIコンテナ経由の Prisma など）がブラウザ側の
// バンドルに引き込まれてしまう。クライアントからは actions.ts を使う。
export { registerAction } from "./presentation/register";
export { loginAction } from "./presentation/login";
export { logoutAction } from "./presentation/logout";
export {
  getCurrentUser,
  requireUser,
  requireUserOrThrow,
} from "./api/current-user";
export { userContainerModule } from "./container";
export type { PublicUser } from "./domain/entities/user";
export type { RegisterInput, LoginInput } from "./schema";
