// 環境変数によって bind される実装が切り替わることの確認。
//
// 既定がモックであることが重要。設定を忘れた環境が勝手に外部へ
// ネットワークアクセスしないよう、安全側に倒している。
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import "reflect-metadata";
import { Container } from "inversify";
import { ENV_FLAGS } from "@/lib/env";
import { CONTENT_EXTRACTION_TYPES } from "../domain/types";

const FLAG = ENV_FLAGS.USE_REAL_CONTENT_EXTRACTOR;
const original = process.env[FLAG];

/**
 * container.ts は読み込み時に env を見るため、毎回モジュールを読み直す。
 *
 * 比較対象のクラスも同じ読み直し後のグラフから取る。resetModules 後は
 * 別インスタンスのクラスになり、外から静的 import したものとは
 * instanceof が一致しないため。
 */
async function resolveExtractor(): Promise<{
  instance: unknown;
  Mock: unknown;
  Http: unknown;
}> {
  const { contentExtractionContainerModule } = await import("../container");
  const { MockContentExtractor } =
    await import("../infrastructure/mock-content-extractor");
  const { HttpContentExtractor } =
    await import("../infrastructure/http-content-extractor");

  const container = new Container();
  container.load(contentExtractionContainerModule);

  return {
    instance: container.get(CONTENT_EXTRACTION_TYPES.ContentExtractor),
    Mock: MockContentExtractor,
    Http: HttpContentExtractor,
  };
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (original === undefined) delete process.env[FLAG];
  else process.env[FLAG] = original;
});

describe("contentExtractionContainerModule", () => {
  it("未設定ならモックを使う（外部アクセスしない）", async () => {
    delete process.env[FLAG];
    const { instance, Mock } = await resolveExtractor();
    expect(instance).toBeInstanceOf(Mock as never);
  });

  it("USE_REAL_CONTENT_EXTRACTOR=true なら本実装を使う", async () => {
    process.env[FLAG] = "true";
    const { instance, Http } = await resolveExtractor();
    expect(instance).toBeInstanceOf(Http as never);
  });

  it("false を明示した場合もモックを使う", async () => {
    process.env[FLAG] = "false";
    const { instance, Mock } = await resolveExtractor();
    expect(instance).toBeInstanceOf(Mock as never);
  });

  it("解釈できない値なら起動時に弾く（黙ってモックに倒さない）", async () => {
    process.env[FLAG] = "ture";
    await expect(resolveExtractor()).rejects.toThrow(
      /USE_REAL_CONTENT_EXTRACTOR/,
    );
  });
});
