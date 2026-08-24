// ドメイン層 - ポート（インターフェース）
// パスワードのハッシュ化と照合の抽象。
//
// hash が受け取るのは RawPassword のみ。ポリシー検証を通っていない平文は
// 型として渡せないため、検証漏れがハッシュ化まで到達しない。
// verify は任意の文字列を受け取る（ログイン試行はポリシーを満たすとは限らないため）。
//
// 将来アルゴリズムを変更する場合は、この実装を差し替えて
// ログイン成功時に再ハッシュする移行処理を足せばよい。
import type { RawPassword } from "../entities/raw-password";

export interface PasswordHasher {
  hash(password: RawPassword): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
