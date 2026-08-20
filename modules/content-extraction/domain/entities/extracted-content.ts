// ドメイン層 - エンティティ
// URL から本文を抽出した結果を表す。
// 「sourceUrl は正規化済みの https URL である」「本文はクイズを作れる長さがある」という
// 保証をこのクラスの生成時に与える。抽出元がモックでも実際の HTTP 取得でも、
// ExtractedContent が存在する時点でこれらは必ず成り立つ。
import { AppError } from "@/lib/errors";
import { assertContentQuality } from "../rules/content-quality";
import { normalizeUrl } from "../rules/url-normalizer";

export type ExtractedContentInput = {
  sourceUrl: string;
  title: string;
  textContent: string;
};

export class ExtractedContent {
  private constructor(
    /** 記事の元URL（正規化済み）。クイズの出典表示に使う */
    readonly sourceUrl: string,
    /** 記事のタイトル。クイズの問題文生成や出典表示に使う */
    readonly title: string,
    /** 記事の本文テキスト。クイズ生成の素材になる */
    readonly textContent: string,
  ) {}

  static create(input: ExtractedContentInput): ExtractedContent {
    // https 以外のスキームやトラッキングパラメータはここで弾く / 除去する
    const sourceUrl = normalizeUrl(input.sourceUrl);
    // 本文が短すぎる（ナビゲーションや広告だけの）ページはクイズを作れない
    assertContentQuality(input.textContent);

    // タイトルが取れなかった場合はホスト名を代わりに使う
    const title = input.title.trim() || new URL(sourceUrl).hostname;
    if (!title) {
      throw new AppError("EXTRACTION_FAILED", "タイトルを決定できませんでした");
    }

    return new ExtractedContent(sourceUrl, title, input.textContent.trim());
  }
}
