// インフラ層 - プロンプトビルダー
// 将来の本実装（Claude API 連携）用のプロンプトテンプレートを定義する。
// 現在はモックが使用するため未呼び出しだが、差し替え時にそのまま利用できるよう用意してある。
export function buildSystemPrompt(): string {
  return `あなたはクイズ生成AIです。与えられた記事の本文から、4択クイズを生成してください。
各問題には、設問文・4つの選択肢・正解のインデックス（0〜3）・解説・出典箇所を含めてください。
出典箇所は本文からの抜粋で200文字以内にしてください。`;
}

export function buildUserPrompt(
  title: string,
  content: string,
  questionCount: number,
): string {
  return `以下の記事から${questionCount}問の4択クイズを生成してください。

タイトル: ${title}

本文:
${content.slice(0, 3000)}`;
}
