// ドメイン層 - エンティティ
// クイズ1問を表す QuizItem を定義する。
// モック・LLM どちらの実装でもこの型で返す。
export type QuizItem = {
  /** 問題文。「〇〇について正しいのはどれか」のような文章 */
  text: string;
  /** 選択肢の配列。必ず4つ（インデックス 0〜3）*/
  choices: string[];
  /** 正解の選択肢番号（0〜3）。choices[answerIndex] が正解 */
  answerIndex: number;
  /** 正解の理由・解説文。回答後にユーザーへ表示する */
  explanation: string;
  /** 問題の根拠となる記事の引用文。回答後に出典として表示する */
  sourceExcerpt: string;
};
