# 実装指示書: ホーム → ローディング → クイズ回答 → 結果 の一連フロー（開発用モック版）

この指示書はCLIエージェント（Claude Code等）に渡し、以下の画面遷移フローを実装させるためのもの。
それ以外の機能には着手しないこと。

## 0. 前提

- Next.js (App Router) / TypeScript strict / npm
- Prisma 6 + SQLite でマイグレーション済み（**本タスクではDBを使用しない**。将来のために温存するだけ）
- パッケージマネージャは npm（pnpm/yarn禁止）

## 1. 実現したい画面遷移

```
ホーム（URL入力）
  ↓ 送信（route遷移する）
ローディング画面（専用ルート。ここで生成処理を実行する）
  ↓ 完了で自動遷移
クイズ回答画面（1問ずつ出題。問題数ぶんループする）
  ↓ 全問回答完了
結果画面（スコアと全問の振り返りを表示）
```

**重要な前提（開発中のみのルール）**
- **どんなURLを入力しても、常に3問のクイズが生成される**。実際のURL到達性・実際のページ内容は問わない
- LLM呼び出しは行わない。クイズの中身はすべてモックで構わない
- この「常に3問・モック」は開発中の割り切りであり、将来ここだけ差し替えれば本実装に移行できる構造にしておくこと（詳細は3章）

## 2. ドメイン分け

今回のスコープでは3ドメインを扱う。

| ドメイン | 責務 | 開発中の扱い |
|---|---|---|
| `content-extraction` | URLを受け取り、ページ内容を取得・抽出する | **モック化**。実際のfetchは行わず、入力URLの文字列から仮のタイトル・本文を組み立てて常に成功させる |
| `quiz-generation` | 抽出結果からクイズを生成する | **モック化**。常に3問固定のダミー問題を返す（実際のLLMは呼ばない） |
| `quiz-session` | 出題・回答受付・採点・スコア確定を行う（新規追加） | 通常ロジックで実装する。ただし永続化はDBではなく**サーバー内メモリの一時ストア**で行う（後述） |

### なぜモック化しても本物と同じ構造にするか
- `content-extraction` と `quiz-generation` は共に `ports`（インターフェース）を挟み、モック実装をその1つの実装として配置する
- これにより、将来「モックを本物に差し替える」作業は、`infrastructure/` に新しいファイルを1つ追加して使用箇所を切り替えるだけで済む
- ドメインルール（URLはhttps必須、SSRFガードの器だけ用意 等）は今回のスコープでは**実装しなくてよい**が、後から迷わず追加できるようディレクトリと関数のシグネチャだけは本設計に沿わせること

### quiz-session の一時ストアについて
- 認証機能がまだ無いため、Attempt（挑戦）とその出題内容をDBに保存しない
- サーバープロセス内のメモリ（`Map`等）に `attemptId` をキーとして保持する簡易ストアを作る
- **この方式は開発時の暫定実装であり、本番運用や複数インスタンス環境では機能しない**ことをコード内コメントに明記すること（将来 `quiz-catalog` ドメイン + DB保存に置き換える）

## 3. ディレクトリ構成

```
src/
├── app/
│   └── (app)/
│       ├── page.tsx                        # ホーム画面（URL入力のみ）
│       ├── generating/
│       │   └── page.tsx                    # ローディング画面（専用ルート）
│       └── attempt/
│           └── [id]/
│               ├── page.tsx                # クイズ回答画面
│               └── result/
│                   └── page.tsx            # 結果画面
│
├── modules/
│   ├── content-extraction/
│   │   ├── domain/
│   │   │   ├── entities/extracted-content.ts   # { sourceUrl, title, textContent }
│   │   │   └── ports/
│   │   │       └── content-extractor.ts         # インターフェース定義
│   │   ├── infrastructure/
│   │   │   └── mock-content-extractor.ts        # ★今回使う実装。fetchせず常に成功させる
│   │   ├── use-cases/
│   │   │   └── extract-content.ts               # portsのcontent-extractorを呼ぶだけ
│   │   └── index.ts                             # 公開API
│   │
│   ├── quiz-generation/
│   │   ├── domain/
│   │   │   ├── entities/generated-quiz.ts
│   │   │   └── ports/
│   │   │       └── quiz-generator.ts            # インターフェース定義
│   │   ├── infrastructure/
│   │   │   └── mock-quiz-generator.ts           # ★常に3問固定で返す
│   │   ├── use-cases/
│   │   │   └── generate-quizzes.ts              # extract-content → quiz-generator
│   │   ├── actions/
│   │   │   └── start-generation.ts              # Server Action。生成しAttemptを作る
│   │   ├── schema.ts                            # 入力Zodスキーマ（url）
│   │   └── index.ts
│   │
│   └── quiz-session/
│       ├── domain/
│       │   ├── entities/
│       │   │   ├── attempt.ts                   # id, quizzes, currentIndex, answers, score
│       │   │   └── answer.ts
│       │   ├── rules/
│       │   │   └── scoring.ts                   # 採点の純粋関数
│       │   └── ports/
│       │       └── attempt-store.ts             # インターフェース（get/save/delete）
│       ├── infrastructure/
│       │   └── in-memory-attempt-store.ts       # ★Mapベースの一時ストア。理由をコメントする
│       ├── use-cases/
│       │   ├── get-attempt.ts
│       │   ├── submit-answer.ts                 # 採点し、attempt-storeを更新
│       │   └── finish-attempt.ts
│       ├── actions/
│       │   └── submit-answer.ts                 # Server Action
│       ├── components/
│       │   ├── question-card.tsx                # 'use client'
│       │   ├── answer-feedback.tsx
│       │   ├── progress-bar.tsx
│       │   ├── result-summary.tsx
│       │   └── result-question-list.tsx
│       ├── api/
│       │   ├── get-attempt-for-play.ts          # RSC用。正解を含まない形で返す
│       │   └── get-attempt-result.ts            # RSC用。完了後の全問振り返り用
│       └── index.ts
│
├── components/
│   ├── ui/                                      # shadcn/ui生成物専用
│   ├── atoms/
│   └── molecules/
│
└── lib/
    ├── errors.ts
    ├── action-result.ts
    └── constants.ts                             # MOCK_QUESTION_COUNT = 3 など
```

`user/` `quiz-catalog/` `analytics/` は今回も作らない。

## 4. 各ドメインの詳細仕様

### content-extraction（モック）

```ts
// domain/ports/content-extractor.ts
interface ContentExtractor {
  extract(url: string): Promise<ExtractedContent>
}
```

`mock-content-extractor.ts` の要件:
- 実際のネットワークアクセスは一切行わない
- URLの形式チェックのみ行う（空文字は弾く。https等の厳密なバリデーションは今回必須ではない）
- 戻り値の `title` は入力URLのホスト名などから機械的に組み立ててよい（例: 「〇〇についての記事」といった固定パターンでよい）
- 常に成功する（失敗ケースを作らない。エラーハンドリングの枠だけ use-case 側に残しておく）

### quiz-generation（モック）

```ts
// domain/ports/quiz-generator.ts
interface QuizGenerator {
  generate(content: ExtractedContent): Promise<GeneratedQuiz[]>
}
```

`mock-quiz-generator.ts` の要件:
- **常に3問**を生成する（`lib/constants.ts` の `MOCK_QUESTION_COUNT = 3` を参照する。ユーザーが入力した問題数選択UIは今回は作らない）
- 各問題は4択、`answerIndex`、`explanation`、`sourceExcerpt` を持つダミーデータでよい。`content.title` を問題文に含めるなどして「生成された感」を出す
- 0.5〜1.5秒のダミー遅延を入れ、ローディング画面が体感できるようにする

`start-generation.ts`（Server Action）の処理:
1. Zodで `{ url: string }` を検証
2. `extract-content` → `generate-quizzes` を呼ぶ
3. 結果を `quiz-session` の attempt-store に新規Attemptとして保存（`mode: 'normal'` 相当。ただし今回は単一モードのみなので `mode` フィールドは省略してよい）
4. `attemptId` を返す

### quiz-session

- 出題は1問ずつ。回答すると即時採点し、正誤・正解・解説を返してから次の問題に進む（正解は回答前のクライアントに渡さない。これは今後の実装でも重要な原則なので今回から守ること）
- 全問回答したらAttemptを完了状態にし、スコアを確定する
- 一度回答した問題への再回答は不可

`in-memory-attempt-store.ts` の要件:
- モジュールスコープの `Map<string, Attempt>` で保持する
- コード冒頭に「開発用の暫定実装。サーバー再起動やインスタンス複数化で消える。将来DB実装に置き換える」という日本語コメントを書く

## 5. 画面仕様

### ホーム画面（`app/(app)/page.tsx`）
- URL入力フィールドのみ（問題数選択UIは今回作らない。常に3問固定のため）
- 送信ボタン押下で `router.push('/generating?url=' + encodeURIComponent(url))` のように**実際にルート遷移**させる（同一画面内で状態を切り替える方式にはしない）
- クライアント側の簡易バリデーション（空文字チェック程度でよい）

### ローディング画面（`app/(app)/generating/page.tsx`）
- クライアントコンポーネント。マウント時（`useEffect`）にクエリパラメータのURLを使って `start-generation` のServer Actionを呼ぶ
- 呼び出し中はスピナー + 「問題を作成中…」等の文言を表示
- 成功したら `router.replace('/attempt/' + attemptId)` で遷移
- 失敗したら（今回は基本発生しない想定だが、枠は作る）エラーメッセージ表示 + 「トップに戻る」導線

### クイズ回答画面（`app/(app)/attempt/[id]/page.tsx`）
- 進捗表示（例: 2 / 3）
- 設問文・選択肢4つ
- 選択肢クリックで即回答 → 正誤・正解・解説を表示 → 「次へ」ボタン（最終問は「結果を見る」）
- 回答後は選択肢をdisableにし、正解を強調表示する

### 結果画面（`app/(app)/attempt/[id]/result/page.tsx`）
- スコア（正答数 / 3）
- 全問の振り返りリスト（設問・自分の回答・正解・解説）
- 「もう一度作る」ボタンでホームへ

### 状態（loading / error / empty）
- ローディング画面が生成中状態を専任するため、クイズ回答画面・結果画面では基本的にloading状態は「データ取得中の一瞬」のみ（スケルトン表示程度でよい）
- Attemptが見つからない（不正な `id` でアクセス）場合は「見つかりません」表示 + ホームへの導線

## 6. Server Actions の形

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ErrorCode; message: string } };

// modules/quiz-generation/actions/start-generation.ts
startGenerationAction(input: { url: string }): Promise<ActionResult<{ attemptId: string }>>

// modules/quiz-session/actions/submit-answer.ts
submitAnswerAction(input: { attemptId: string; questionIndex: number; selectedIndex: number })
  : Promise<ActionResult<{ isCorrect: boolean; answerIndex: number; explanation: string }>>
```

- throwでエラーを伝えない。必ずActionResultで返す
- 入力は必ずZodで検証する

## 7. コーディング規約（前回と共通）

- TypeScript strict、`any` 禁止
- Server Component がデフォルト。`'use client'` は必要な末端のみ（フォーム、回答ボタン、ローディング画面のuseEffect部分など）
- マジックナンバー禁止。`MOCK_QUESTION_COUNT` 等は `lib/constants.ts` に定数化
- モジュール間import禁止。他モジュールを使うときは必ず `index.ts` 経由

## 8. 実装手順（この順番で進めること）

1. `lib/constants.ts`, `lib/errors.ts`, `lib/action-result.ts`
2. `modules/content-extraction`: entities → ports → mock実装 → use-case → index.ts
3. `modules/quiz-generation`: entities → ports → mock実装（3問固定・遅延つき） → use-case
4. `modules/quiz-session`: entities（attempt, answer） → rules/scoring.ts → ports/attempt-store → in-memory実装
5. `modules/quiz-session`: use-cases（get-attempt, submit-answer, finish-attempt）
6. `modules/quiz-generation/actions/start-generation.ts`（content-extraction → quiz-generation → quiz-sessionへ保存）
7. `modules/quiz-session/actions/submit-answer.ts`
8. `modules/quiz-session/api/get-attempt-for-play.ts`, `get-attempt-result.ts`
9. shadcn/uiの必要コンポーネントを `npx shadcn add` で追加
10. `app/(app)/page.tsx`（ホーム画面。router.pushで遷移）
11. `app/(app)/generating/page.tsx`（ローディング画面。useEffectでAction呼び出し）
12. `modules/quiz-session/components/`（question-card, answer-feedback, progress-bar）
13. `app/(app)/attempt/[id]/page.tsx`
14. `modules/quiz-session/components/`（result-summary, result-question-list）
15. `app/(app)/attempt/[id]/result/page.tsx`
16. 動作確認: 適当な文字列をURLとして入力しても、ローディング→3問の回答→結果まで一連の流れが通ることを確認

## 9. 完了の定義（Acceptance Criteria）

- [ ] ホームでURLらしき文字列を入力すると、`/generating` へルート遷移する
- [ ] ローディング画面が表示され、その裏で生成処理（今回はモック）が走る
- [ ] 生成完了後、自動的に `/attempt/[id]` へ遷移する
- [ ] どんなURL文字列を入れても、必ずモックに記載の3問のクイズが出題される
- [ ] 1問ずつ出題され、回答すると正誤・解説が表示され、次へ進める
- [ ] 3問目回答後、結果画面へ遷移しスコアと全問の振り返りが表示される
- [ ] 正解・解説は回答前のクライアントに送られていない（回答後のレスポンスで初めて渡る設計になっている）
- [ ] 存在しない `attemptId` でアクセスすると「見つかりません」的な表示になる
- [ ] `npm run build` が通る
- [ ] `npm run lint` が通る

## 10. 確認事項（実装前にエージェントが解釈で迷いそうな点）

- `content-extraction` のSSRFガード・robots.txt確認等の本格的なルールは**今回実装しない**。ports/use-caseの型だけ本設計に沿わせておく
- DB（Prisma）は今回のタスクでは一切使用しない