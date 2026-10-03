// ページ位置の判定。
// ページ番号は URL から来る外部入力なので、範囲外をどう扱うかが要点になる。
// 弾かずに丸めることで、URL を直接編集されても件数が減っても画面が壊れない。
import { describe, it, expect } from "vitest";
import { AppError, type ErrorCode } from "@/lib/errors";
import { Page } from "../page";

function pageOf(requested: number, totalCount: number, pageSize = 30): Page {
  return Page.of({ requested, totalCount, pageSize });
}

function expectAppError(fn: () => unknown, code: ErrorCode): void {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe(code);
    return;
  }
  throw new Error(`AppError(${code}) が投げられませんでした`);
}

describe("Page.of", () => {
  it("総ページ数を切り上げで求める", () => {
    expect(pageOf(1, 61).totalPages).toBe(3);
    expect(pageOf(1, 60).totalPages).toBe(2);
    expect(pageOf(1, 1).totalPages).toBe(1);
  });

  it("0件でも1ページは存在する（空状態を描くため）", () => {
    const page = pageOf(1, 0);
    expect(page.totalPages).toBe(1);
    expect(page.number).toBe(1);
    expect(page.isPaginated).toBe(false);
  });

  it("1ページに収まるならページ送りを出さない", () => {
    expect(pageOf(1, 30).isPaginated).toBe(false);
    expect(pageOf(1, 31).isPaginated).toBe(true);
  });

  it("1未満は1に丸める", () => {
    expect(pageOf(0, 100).number).toBe(1);
    expect(pageOf(-5, 100).number).toBe(1);
  });

  it("総ページ数を超えたら最終ページに丸める", () => {
    expect(pageOf(99, 61).number).toBe(3);
  });

  it("整数でない要求は1ページ目として扱う", () => {
    expect(pageOf(NaN, 100).number).toBe(1);
    expect(pageOf(1.5, 100).number).toBe(1);
  });

  it("1ページあたりの件数が不正なら受け付けない", () => {
    expectAppError(() => pageOf(1, 10, 0), "VALIDATION_ERROR");
    expectAppError(() => pageOf(1, 10, -1), "VALIDATION_ERROR");
  });

  it("総件数が負なら受け付けない", () => {
    expectAppError(() => pageOf(1, -1), "VALIDATION_ERROR");
  });
});

describe("Page の取得範囲", () => {
  it("1ページ目は先頭から取る", () => {
    const page = pageOf(1, 100);
    expect(page.offset).toBe(0);
    expect(page.limit).toBe(30);
  });

  it("2ページ目は1ページ分ずらして取る", () => {
    expect(pageOf(2, 100).offset).toBe(30);
  });

  it("最終ページは端数になる", () => {
    const page = pageOf(3, 61);
    expect(page.offset).toBe(60);
    expect(page.itemCount).toBe(1);
    expect(page.firstIndex).toBe(61);
    expect(page.lastIndex).toBe(61);
  });

  it("表示範囲を1始まりで返す", () => {
    const page = pageOf(2, 100);
    expect(page.firstIndex).toBe(31);
    expect(page.lastIndex).toBe(60);
  });

  it("0件なら範囲は0", () => {
    const page = pageOf(1, 0);
    expect(page.firstIndex).toBe(0);
    expect(page.lastIndex).toBe(0);
    expect(page.itemCount).toBe(0);
  });
});

describe("Page の前後", () => {
  it("先頭では前へ進めない", () => {
    const page = pageOf(1, 100);
    expect(page.hasPrev).toBe(false);
    expect(page.hasNext).toBe(true);
  });

  it("末尾では次へ進めない", () => {
    const page = pageOf(4, 100);
    expect(page.hasPrev).toBe(true);
    expect(page.hasNext).toBe(false);
  });

  it("1ページしかなければどちらにも進めない", () => {
    const page = pageOf(1, 5);
    expect(page.hasPrev).toBe(false);
    expect(page.hasNext).toBe(false);
  });
});
