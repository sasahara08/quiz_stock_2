// ドメイン層 - 値オブジェクト
// 一覧のページ位置。
//
// 「何ページ目を見ているか」は URL のクエリから来るため、外部入力として
// そのまま信用できない。範囲外の値をどう扱うかの判断をここに集約し、
// 画面側は渡された位置を描くだけでよいようにする。
import { AppError } from "@/lib/errors";

export type PageInput = {
  /** 要求されたページ番号（1始まり）。範囲外でもよい */
  requested: number;
  /** 絞り込み後の総件数 */
  totalCount: number;
  /** 1ページあたりの件数 */
  pageSize: number;
};

export class Page {
  private constructor(
    /** 実際に表示するページ番号（1始まり） */
    readonly number: number,
    readonly totalPages: number,
    readonly pageSize: number,
    readonly totalCount: number,
  ) {}

  static of(input: PageInput): Page {
    if (!Number.isInteger(input.pageSize) || input.pageSize < 1) {
      throw new AppError(
        "VALIDATION_ERROR",
        `1ページあたりの件数が不正です: ${input.pageSize}`,
      );
    }
    if (!Number.isInteger(input.totalCount) || input.totalCount < 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        `総件数が不正です: ${input.totalCount}`,
      );
    }

    // 0件でも1ページ目は存在する（空状態を表示するため）
    const totalPages = Math.max(
      1,
      Math.ceil(input.totalCount / input.pageSize),
    );

    // 範囲外は弾かずに丸める。URL を直接編集されたり、件数が減って
    // 存在しないページを指すようになっても、画面が壊れないようにする。
    const number = Number.isInteger(input.requested)
      ? Math.min(Math.max(input.requested, 1), totalPages)
      : 1;

    return new Page(number, totalPages, input.pageSize, input.totalCount);
  }

  /** 取得開始位置（0始まり） */
  get offset(): number {
    return (this.number - 1) * this.pageSize;
  }

  get limit(): number {
    return this.pageSize;
  }

  get hasPrev(): boolean {
    return this.number > 1;
  }

  get hasNext(): boolean {
    return this.number < this.totalPages;
  }

  /** ページ送りを出す必要があるか。1ページに収まるなら出さない */
  get isPaginated(): boolean {
    return this.totalPages > 1;
  }

  /** このページに並ぶ件数（最終ページは端数になる） */
  get itemCount(): number {
    if (this.totalCount === 0) return 0;
    return Math.min(this.pageSize, this.totalCount - this.offset);
  }

  /** 「N件目〜M件目」の表示に使う範囲（1始まり） */
  get firstIndex(): number {
    return this.totalCount === 0 ? 0 : this.offset + 1;
  }

  get lastIndex(): number {
    return this.offset + this.itemCount;
  }
}
