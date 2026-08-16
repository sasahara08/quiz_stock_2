// ドメイン層 - エンティティ
// クイズ1問に対するユーザーの回答を表す。
export type Answer = {
  /** 何問目への回答か（0始まりのインデックス）*/
  questionIndex: number;
  /** ユーザーが選んだ選択肢の番号（0〜3）*/
  selectedIndex: number;
  /** 正解かどうか。selectedIndex === quiz.answerIndex なら true */
  isCorrect: boolean;
};
