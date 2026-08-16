// ドメイン層 - エンティティ
// 1回のクイズ挑戦（Attempt）を表す。
// quizzes には正解・解説を含む全データを保持するが、クライアントには回答前に送出しない。
import type { Answer } from "./answer";

/** クイズセッションの進行状態 */
export type AttemptStatus =
  | "in-progress" // 回答中（まだ終わっていない）
  | "finished";   // 全問回答済み・スコア確定済み

/** Attempt の中に保存するクイズ1問分のデータ（正解情報を含む） */
export type AttemptQuiz = {
  /** 問題文 */
  text: string;
  /** 選択肢の配列（4つ）*/
  choices: string[];
  /** 正解の選択肢番号（0〜3）。回答前はクライアントに送らない */
  answerIndex: number;
  /** 解説文。回答後にクライアントへ送る */
  explanation: string;
  /** 記事の引用文。回答後に出典として表示する */
  sourceExcerpt: string;
};

/** 1回のクイズ挑戦全体を表すエンティティ */
export type Attempt = {
  /** セッションを一意に識別するID（UUID）*/
  id: string;
  /** このセッションで出題される全クイズ（正解情報込み）。サーバー内にのみ保持 */
  quizzes: AttemptQuiz[];
  /** 次に出題する問題のインデックス（0始まり）。回答のたびに +1 される */
  currentIndex: number;
  /** これまでのユーザーの回答履歴 */
  answers: Answer[];
  /** セッションの進行状態 */
  status: AttemptStatus;
  /** 正答数。finished になるまでは null */
  score: number | null;
  /** 出典記事のタイトル。結果画面の出典表示に使う */
  sourceTitle: string;
  /** 出典記事のURL。結果画面の出典リンクに使う */
  sourceUrl: string;
};
