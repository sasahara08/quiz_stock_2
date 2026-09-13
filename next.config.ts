import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 はネイティブモジュールのため、バンドルせず実行時に読み込ませる。
  serverExternalPackages: ["better-sqlite3"],

  // localhost 以外のホスト名で開発サーバーを開くときに必要。
  // 未設定だと /_next/static/chunks/*.js までブロックされ、HTML は表示されるのに
  // React が hydrate せず、入力に反応しない（送信ボタンが disabled のまま固まる）。
  // 開発時のみの設定で、本番ビルドには影響しない。
  allowedDevOrigins: ["100.103.94.70", "home-server.tail7649bf.ts.net"],
};

export default nextConfig;
