// quiz-session モジュールの公開 API（クライアント向け）
//
// 'use client' なコンポーネントはこのファイルから import する。
// index.ts はサーバー専用の関数（DIコンテナ経由で Prisma に到達する）も
// 公開しているため、クライアントから import するとサーバー用コードが
// ブラウザ側のバンドルに引き込まれてしまう。
// ここが公開するのは 'use server' なファイルだけなので、
// クライアントバンドルには「サーバーを呼ぶ参照」しか残らない。
export { submitAnswerAction } from "./presentation/submit-answer";
