import { STORAGE_KEY } from "./session";
type Snapshot = string | null;
type SessionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Each window keeps the exact snapshot it loaded or last saved. Compare before
// mutating so an outdated window cannot overwrite a newer or deleted record.
export class SessionStorageGuard {
  private expected: Snapshot;
  constructor(snapshot: Snapshot) {
    this.expected = snapshot;
  }

  changed(storage: SessionStorage): boolean {
    return storage.getItem(STORAGE_KEY) !== this.expected;
  }

  write(storage: SessionStorage, snapshot: string): boolean {
    if (this.changed(storage)) return false;
    if (snapshot !== this.expected) storage.setItem(STORAGE_KEY, snapshot);
    this.expected = snapshot;
    return true;
  }

  remove(storage: SessionStorage): boolean {
    const current = storage.getItem(STORAGE_KEY);
    if (current !== null && current !== this.expected) return false;
    if (current !== null) storage.removeItem(STORAGE_KEY);
    this.expected = null;
    return true;
  }
}

// On compatible secure origins, serialize the compare + mutation across
// same-origin app windows. Older contexts still compare immediately before writing.
export async function withSessionStorageLock<T>(
  action: () => T,
  locks?: Pick<LockManager, "request">,
): Promise<T> {
  if (locks) return locks.request(STORAGE_KEY, () => action()) as Promise<T>;
  return action();
}
