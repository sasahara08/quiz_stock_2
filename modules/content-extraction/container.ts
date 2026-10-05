// DI コンポジション（モジュール単位）
// ポート（ContentExtractor）と実装をここでのみ結び付ける。
//
// モックと本実装の切り替えは環境変数で行う。既定はモックで、
// USE_REAL_CONTENT_EXTRACTOR を立てたときだけ実際にページを取得する。
// 設定を忘れた環境が勝手に外部へアクセスしないよう、安全側を既定にしている。
import "reflect-metadata";
import { ContainerModule } from "inversify";
import { ENV_FLAGS, readBooleanEnv } from "@/lib/env";
import { CONTENT_EXTRACTION_TYPES } from "./domain/types";
import { HttpContentExtractor } from "./infrastructure/http-content-extractor";
import { MockContentExtractor } from "./infrastructure/mock-content-extractor";
import { ExtractContentUseCase } from "./use-cases/extract-content";

export const contentExtractionContainerModule = new ContainerModule(
  ({ bind }) => {
    const useReal = readBooleanEnv(ENV_FLAGS.USE_REAL_CONTENT_EXTRACTOR, false);

    bind(CONTENT_EXTRACTION_TYPES.ContentExtractor)
      .to(useReal ? HttpContentExtractor : MockContentExtractor)
      .inSingletonScope();
    bind(ExtractContentUseCase).toSelf().inSingletonScope();
  },
);
