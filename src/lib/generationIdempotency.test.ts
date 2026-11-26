import { describe, expect, it, vi, afterEach } from "vitest";
import { buildIdempotencyKeyAt } from "./stripeWebhookLogic";

afterEach(() => vi.restoreAllMocks());

describe("generation_jobs idempotency key", () => {
  const USER  = "user-abc-123";
  const SID   = "session-xyz-456";
  const T0    = 1_700_000_000_000; // arbitrary fixed epoch ms

  it("format is {user_id}:{session_id}:{epoch_hour}", () => {
    const key = buildIdempotencyKeyAt(USER, SID, T0);
    const [uid, sid, hour] = key.split(":");
    expect(uid).toBe(USER);
    expect(sid).toBe(SID);
    expect(Number(hour)).toBe(Math.floor(T0 / 3_600_000));
  });

  it("same user + session + same clock hour → identical key (deduplicated)", () => {
    const key1 = buildIdempotencyKeyAt(USER, SID, T0);
    const key2 = buildIdempotencyKeyAt(USER, SID, T0 + 1800_000); // 30min later, same hour
    expect(key1).toBe(key2);
  });

  it("same user + session but different clock hour → different key (new attempt allowed)", () => {
    const key1 = buildIdempotencyKeyAt(USER, SID, T0);
    const key2 = buildIdempotencyKeyAt(USER, SID, T0 + 3_600_001); // 1 hour + 1ms later
    expect(key1).not.toBe(key2);
  });

  it("different users with same session id → different keys", () => {
    const key1 = buildIdempotencyKeyAt("user-A", SID, T0);
    const key2 = buildIdempotencyKeyAt("user-B", SID, T0);
    expect(key1).not.toBe(key2);
  });

  it("null sessionId uses 'nosession' sentinel", () => {
    const key = buildIdempotencyKeyAt(USER, null, T0);
    expect(key).toContain(":nosession:");
  });

  it("different sessions for the same user → different keys", () => {
    const key1 = buildIdempotencyKeyAt(USER, "sess-1", T0);
    const key2 = buildIdempotencyKeyAt(USER, "sess-2", T0);
    expect(key1).not.toBe(key2);
  });
});
