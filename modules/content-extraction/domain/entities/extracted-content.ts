// ドメイン層 - エンティティ
// URL から本文を抽出した結果を表す型。
// このモジュールの処理が成功したときに返される唯一のデータ構造。
export type ExtractedContent = {
  /** 記事の元URL（正規化済み）。クイズの出典表示に使う */
  sourceUrl: string;
  /** 記事のタイトル。クイズの問題文生成や出典表示に使う */
  title: string;
  /** 記事の本文テキスト。クイズ生成の素材になる */
  textContent: string;
};
