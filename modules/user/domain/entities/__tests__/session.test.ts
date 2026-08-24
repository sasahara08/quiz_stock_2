// Session がセッションのルールを自分で守っていることを確認するテスト。
import { describe, it, expect } from "vitest";
import { SESSION_TTL_DAYS } from "@/lib/constants";
import { Session } from "../session";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-01-01T00:00:00Z");

describe("Session.issue", () => {
  it("平文トークンと、そのハッシュを持つセッションを返す", () => {
    const { session, token } = Session.issue("user-1", NOW);
    expect(token.length).toBeGreaterThan(0);
    expect(session.tokenHash).toBe(Session.hashToken(token));
  });

  it("平文トークンをセッションに保持しない", () => {
    const { session, token } = Session.issue("user-1", NOW);
    expect(JSON.stringify(session.toSnapshot())).not.toContain(token);
  });

  it("発行のたびに異なるトークンになる（セッション固定攻撃の防止）", () => {
    const a = Session.issue("user-1", NOW);
    const b = Session.issue("user-1", NOW);
    expect(a.token).not.toBe(b.token);
    expect(a.session.tokenHash).not.toBe(b.session.tokenHash);
  });

  it("有効期限が SESSION_TTL_DAYS 後になる", () => {
    const { session } = Session.issue("user-1", NOW);
    expect(session.expiresAt.getTime()).toBe(
      NOW.getTime() + SESSION_TTL_DAYS * MS_PER_DAY,
    );
  });
});

describe("Session.hashToken", () => {
  it("同じトークンからは常に同じハッシュになる", () => {
    expect(Session.hashToken("abc")).toBe(Session.hashToken("abc"));
  });

  it("異なるトークンからは異なるハッシュになる", () => {
    expect(Session.hashToken("abc")).not.toBe(Session.hashToken("abd"));
  });
});

describe("Session#isExpired", () => {
  it("有効期限内なら有効と判定する", () => {
    const { session } = Session.issue("user-1", NOW);
    const oneDayLater = new Date(NOW.getTime() + MS_PER_DAY);
    expect(session.isExpired(oneDayLater)).toBe(false);
    expect(session.isActive(oneDayLater)).toBe(true);
  });

  it("有効期限ちょうどは期限切れとする", () => {
    const { session } = Session.issue("user-1", NOW);
    expect(session.isExpired(session.expiresAt)).toBe(true);
  });

  it("有効期限を過ぎたら期限切れとする", () => {
    const { session } = Session.issue("user-1", NOW);
    const tooLate = new Date(NOW.getTime() + (SESSION_TTL_DAYS + 1) * MS_PER_DAY);
    expect(session.isExpired(tooLate)).toBe(true);
    expect(session.isActive(tooLate)).toBe(false);
  });
});

describe("Session のスナップショット", () => {
  it("復元しても有効期限の判定が変わらない", () => {
    const { session } = Session.issue("user-1", NOW);
    const restored = Session.fromSnapshot(session.toSnapshot());
    expect(restored.tokenHash).toBe(session.tokenHash);
    expect(restored.userId).toBe("user-1");
    expect(restored.isExpired(session.expiresAt)).toBe(true);
  });
});
