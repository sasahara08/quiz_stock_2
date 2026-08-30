# QuizStack

記事のURLから4択クイズを生成し、1問ずつ出題して採点する学習アプリ。
間違えた問題は復習対象として溜まり、あとからまとめて解き直せる。

- **現行仕様**: [`docs/spec.md`](docs/spec.md)（画面・ルール・未実装項目の正）
- **フェーズ1の実装指示書**: [`init.md`](init.md)（凍結。現状とは一致しない）

## セットアップ

```bash
npm install
npx prisma migrate deploy   # dev.db にスキーマを適用
npx prisma generate
npm run dev                 # http://localhost:3000
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm test` | ユニットテスト（vitest） |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

DB は SQLite（リポジトリ直下の `dev.db`）。接続先は `DATABASE_URL` で上書きできる。
既定値は `lib/prisma.ts` と `prisma.config.ts` の両方に書いてあり、**必ず揃えること**
（ずれると CLI とアプリが別の DB を見る）。

## 技術構成

Next.js 16（App Router） / React 19 / TypeScript strict / Prisma 7 + SQLite /
InversifyJS（DI） / Zod / Tailwind 4 + shadcn-ui / vitest

---

## モジュール構成

業務上の関心事ごとに `modules/` を分ける（モジュラーモノリス）。
技術レイヤー（controllers / services / models）では分けない。

```
app/                       画面とルーティングのみ。業務ロジックは持たない
  (app)/                   ログイン必須。共通ヘッダーあり
    page.tsx               ホーム（URL入力）
    generating/            生成中
    attempt/[id]/          出題 → result/ 結果
    dashboard/             ダッシュボード
    quizzes/               問題一覧
    review/                復習待ち一覧
  (auth)/                  未ログイン向け。login/ signup/

modules/                   ドメインごとのモジュール（下表）
components/                モジュールに属さない共通UI
  ui/                      shadcn/ui の生成物専用。手を入れない
  atoms/                   ui/ の再エクスポート層（差し替え点）
  molecules/               atom を組み合わせた小部品
  organisms/               画面共通のシェル（ヘッダー、ユーザーメニュー）
lib/                       全モジュール共通の土台
  container.ts             DI コンポジションルート
  errors.ts                ErrorCode とユーザー向け文言
  action-result.ts         Server Action の戻り値型
  constants.ts             マジックナンバーの集約
  prisma.ts / relative-time.ts / utils.ts
prisma/                    schema.prisma と migrations/
docs/spec.md               現行仕様書
```

### モジュール一覧

| モジュール | 責務 | 主なエンティティ | 実装 |
|---|---|---|---|
| `user` | 登録・認証・セッション | `User` `Session` `RawPassword` | 本実装（scrypt + DB） |
| `content-extraction` | URLから本文を抽出 | `ExtractedContent` | **モック**（ネットワーク未使用） |
| `quiz-generation` | 抽出結果からクイズを生成 | `QuizItem` | **モック**（3問固定） |
| `quiz-catalog` | クイズの保管・検索・正誤状態 | `Quiz` `GenerationBatch` | 本実装（DB） |
| `quiz-session` | 出題・回答・採点 | `Attempt` `AttemptQuiz` `Answer` | 本実装（DB） |
| `analytics` | 学習状況の集計 | `Dashboard` `StudyCalendar` | 本実装（DB集計） |

`quiz-catalog` が復習の土台。**「最後に答えて間違えたか（`Quiz.lastIsCorrect`）」が
復習対象を決める唯一の基準**で、回答のたびに `quiz-session` から更新される。

### モジュール内の層

各モジュールは同じ層構成に従う。外向きの層は必要なものだけ持つ。

```
modules/<name>/
├── domain/          核。外部を一切知らない
│   ├── entities/    ドメインのルールを持つ。不変条件は生成時に検証する
│   ├── rules/       副作用のない純粋関数
│   ├── ports/       外部との接点のインターフェース
│   └── types.ts     DIトークン（Symbol）
├── use-cases/       取得 → エンティティに委譲 → 保存。判断はしない
├── infrastructure/  ポートの実装。差し替え可能
├── presentation/    Server Action（'use server'）
├── api/             RSC から呼ぶ読み取り。画面向けの形に詰め替える
├── components/      その文脈専用のUI
├── container.ts     ポートと実装の結線（1箇所）
├── actions.ts       クライアント向けの公開口
└── index.ts         サーバー向けの公開口
```

|  | domain | use-cases | infra | presentation | api | components |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `user` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `quiz-session` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `quiz-catalog` | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `quiz-generation` | ✓ | ✓ | ✓ | ✓ | — | — |
| `analytics` | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `content-extraction` | ✓ | ✓ | ✓ | — | — | — |

### モジュール間の依存

```
quiz-generation ──→ content-extraction   本文抽出の結果を受け取る
                ──→ quiz-catalog         生成したクイズを保管する
                ──→ quiz-session         保管したクイズで出題を始める
                ──→ user                 誰の生成かを決める
quiz-session    ──→ quiz-catalog         出題対象を引く / 正誤を書き戻す
                ──→ user                 誰の挑戦かを決める
```

`content-extraction` と `user` はどこにも依存しない。

---

## 設計上の決まりごと

### エンティティがドメインの挙動を持つ

「順番どおりにしか回答できない」「同じ問題に二度回答できない」「間違えたままなら
復習対象」といったルールは、ユースケースではなく**エンティティの内側**で守る。
不変条件は生成時（`create` / `of` / `start`）に検証し、それを通らないインスタンスが
存在できないようにする。ユースケースは取得・委譲・保存の調整だけを行う。

エンティティはイミュータブル。状態の変更は常に新しいインスタンスを返す。

### モジュール境界

公開口は用途で3つに分かれる。

| 入口 | 使う側 | 中身 |
|---|---|---|
| `index.ts` | サーバー（RSC・他モジュールのサーバーコード） | ユースケース・`api/`・コンテナ |
| `actions.ts` | `'use client'` なコンポーネント | Server Action だけ |
| `components/<name>.tsx` | 画面（直接パスで import） | UIコンポーネント |

**`'use client'` から `index.ts` を import してはいけない。** サーバー専用の依存
（DIコンテナ経由の Prisma など）がブラウザ側のバンドルに引き込まれ、ビルドが壊れる。
コンポーネントを `index.ts` に載せないのも同じ理由。

**モジュールは画面共通のナビゲーションUIを持たない。** 共通の器は
`components/organisms/` に置き、モジュールは自分の関心事の部品だけを提供して、
両者を結び付けるのは `app/` のレイアウトの役割とする。

### DI

ポートと実装の結び付けは各モジュールの `container.ts` の1箇所だけ。
モックを本実装に差し替えるときは **bind 先を変えるだけ**で済むようにする。
全モジュールのコンテナは `lib/container.ts` で束ねる。

### エラー

Server Action は例外を throw せず、必ず `ActionResult<T>`（成功/失敗の判別共用体）で
返す。`ErrorCode` とユーザー向け文言は `lib/errors.ts` に集約する。

### その他

- TypeScript strict、`any` 禁止
- Server Component がデフォルト。`'use client'` は必要な末端のみ
- 入力の検証は境界で Zod。ただし Zod が見るのは「型どおりか」まで。
  業務ルールの判断はドメインが行う
- マジックナンバー禁止。`lib/constants.ts` に集約する

---

## 既知の割り切り

| 項目 | 現状 |
|---|---|
| 本文抽出がモック | HTTP取得と Readability の実装はあるが未接続・未検証 |
| クイズ生成がモック | プロンプトと出力スキーマは用意済み・未接続。常に3問 |
| `analytics` が他モジュールのテーブルを直接読む | 読み取り専用の集計ビューとしての意図的な例外。書き込みはしない |
| 復習の判定が単純 | 「間違えたまま」のみ。まぐれ正解で対象から外れる（`docs/spec.md` 第5章） |
| モジュール境界が機械的に強制されていない | `index.ts` 経由の規約はコメントのみ |
| ダークモードが無効 | トークンは揃っているが `.dark` を付ける仕組みがない |

詳細と解消の条件は [`docs/spec.md`](docs/spec.md) の「未実装・保留」を参照。
