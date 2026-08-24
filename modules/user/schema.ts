// Server Action の入力バリデーションスキーマ
// ここで見るのは「外部から届いた値が型どおりか」まで。
// メールアドレスの正規化やパスワードポリシーはドメイン層が判断する。
import { z } from "zod";

export const registerInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(1),
  password: z.string().min(1),
});

export const loginInputSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
