import { test } from "node:test";
import assert from "node:assert/strict";
import { STORAGE_KEY } from "./session";
import { SessionStorageGuard, withSessionStorageLock } from "./sessionStorageGuard";

function shared(seed: string | null) {
  const map = new Map<string, string>();
  if (seed !== null) map.set(STORAGE_KEY, seed);
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
  };
}

test("another window's current record survives stale save and stale deletion", () => {
  const initial = '{"theme":"example","score":1}';
  const newer = '{"theme":"example","score":7}';
  const store = shared(initial);
  const a = new SessionStorageGuard(initial);
  const b = new SessionStorageGuard(initial);
  assert.equal(a.write(store, newer), true);
  assert.equal(b.changed(store), true);
  assert.equal(b.write(store, '{"theme":"updated","score":1}'), false);
  assert.equal(b.remove(store), false);
  assert.equal(store.getItem(STORAGE_KEY), newer);
});

test("removal stops a second window from restoring an old snapshot", () => {
  const store = shared("before");
  const a = new SessionStorageGuard("before");
  const b = new SessionStorageGuard("before");
  assert.equal(a.remove(store), true);
  assert.equal(b.changed(store), true);
  assert.equal(b.write(store, "later stale edit"), false);
  assert.equal(store.getItem(STORAGE_KEY), null);
  assert.equal(a.write(store, "explicitly opted back in"), true);
});

test("two first-time saves use the same exclusive lock and first write wins", async () => {
  const store = shared(null);
  const a = new SessionStorageGuard(null);
  const b = new SessionStorageGuard(null);
  let tail: Promise<unknown> = Promise.resolve();
  const locks = {
    request(name: string, callback: () => unknown) {
      assert.equal(name, STORAGE_KEY);
      const queued = tail.then(callback);
      tail = queued;
      return queued;
    },
  } as Pick<LockManager, "request">;
  const results = await Promise.all([
    withSessionStorageLock(() => a.write(store, "first window"), locks),
    withSessionStorageLock(() => b.write(store, "second window"), locks),
  ]);
  assert.deepEqual(results, [true, false]);
  assert.equal(store.getItem(STORAGE_KEY), "first window");
});

test("storage mutation failures never advance the window snapshot", () => {
  const store = shared("initial");
  const guard = new SessionStorageGuard("initial");
  assert.throws(() => guard.write({ ...store, setItem() { throw Error("quota"); } }, "new"));
  assert.equal(guard.changed(store), false);
  assert.equal(guard.write(store, "new"), true);
});
