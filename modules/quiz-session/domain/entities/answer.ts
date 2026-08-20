// ドメイン層 - 値オブジェクト
// クイズ1問に対するユーザーの回答を表す。
// 生成後は不変。正誤（isCorrect）は回答時に確定し、以後変化しない
// （採点ロジックを変更しても過去の回答結果に影響させないため）。
export type AnswerSnapshot = {
  questionIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
};

export class Answer {
  private constructor(
    /** 何問目への回答か（0始まりのインデックス）*/
    readonly questionIndex: number,
    /** ユーザーが選んだ選択肢の番号 */
    readonly selectedIndex: number,
    /** 正解かどうか。判定は AttemptQuiz が行い、その結果をここに固定する */
    readonly isCorrect: boolean,
  ) {}

  static record(
    questionIndex: number,
    selectedIndex: number,
    isCorrect: boolean,
  ): Answer {
    return new Answer(questionIndex, selectedIndex, isCorrect);
  }

  static fromSnapshot(snapshot: AnswerSnapshot): Answer {
    return new Answer(
      snapshot.questionIndex,
      snapshot.selectedIndex,
      snapshot.isCorrect,
    );
  }

  /** この回答が指定した問題に対するものかを判定する */
  isFor(questionIndex: number): boolean {
    return this.questionIndex === questionIndex;
  }

  toSnapshot(): AnswerSnapshot {
    return {
      questionIndex: this.questionIndex,
      selectedIndex: this.selectedIndex,
      isCorrect: this.isCorrect,
    };
  }
}
