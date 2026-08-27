// DI コンポジション（モジュール単位）
// ポートと実装をここでのみ結び付ける。
// パスワードのハッシュ方式やユーザーの保存先を変える場合は、
// このファイルの bind 先を変更するだけでよい。
import "reflect-metadata";
import { ContainerModule } from "inversify";
import { USER_TYPES } from "./domain/types";
import { PrismaSessionRepository } from "./infrastructure/prisma-session-repository";
import { PrismaUserRepository } from "./infrastructure/prisma-user-repository";
import { ScryptPasswordHasher } from "./infrastructure/scrypt-password-hasher";
import { GetCurrentUserUseCase } from "./use-cases/get-current-user";
import { LoginUserUseCase } from "./use-cases/login-user";
import { LogoutUserUseCase } from "./use-cases/logout-user";
import { RegisterUserUseCase } from "./use-cases/register-user";

export const userContainerModule = new ContainerModule(({ bind }) => {
  bind(USER_TYPES.UserRepository).to(PrismaUserRepository).inSingletonScope();
  bind(USER_TYPES.SessionRepository).to(PrismaSessionRepository).inSingletonScope();
  bind(USER_TYPES.PasswordHasher).to(ScryptPasswordHasher).inSingletonScope();
  bind(RegisterUserUseCase).toSelf().inSingletonScope();
  bind(LoginUserUseCase).toSelf().inSingletonScope();
  bind(GetCurrentUserUseCase).toSelf().inSingletonScope();
  bind(LogoutUserUseCase).toSelf().inSingletonScope();
});
