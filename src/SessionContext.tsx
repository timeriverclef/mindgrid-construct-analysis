import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SessionData } from "./types";
import { freshSession, parseSession, STORAGE_KEY } from "./lib/session";
import { SessionStorageGuard, withSessionStorageLock } from "./lib/sessionStorageGuard";

function initial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      data: raw ? parseSession(raw) : freshSession(),
      raw,
      persist: !!raw,
      error: "",
    };
  } catch {
    return {
      data: freshSession(),
      raw: null,
      persist: false,
      error: "无法读取已保存的会话；原记录未被覆盖。可尝试导入备份文件。",
    };
  }
}
const SessionContext = createContext<{
  data: SessionData;
  update: (fn: (d: SessionData) => SessionData) => void;
  replace: (d: SessionData) => void;
  persist: boolean;
  setPersist: (v: boolean) => void;
  saveStatus: string;
  saveConflict: boolean;
  savePending: boolean;
  reset: () => void;
} | null>(null);

export function SessionProvider({ children, demo }: { children: ReactNode; demo?: () => SessionData }) {
  const [boot] = useState(() => demo
    ? { data: demo(), raw: null, persist: false, error: "" }
    : initial());
  const [data, setData] = useState(boot.data);
  const [persist, setPersistValue] = useState(boot.persist);
  const persistRef = useRef(boot.persist);
  const [guard] = useState(() => new SessionStorageGuard(boot.raw));
  const [saveConflict, setConflict] = useState(false);
  const blocked = useRef(false);
  const bootEdited = useRef(false);
  const [savePending, setPending] = useState(false);
  const pending = useRef(false);
  const [saveStatus, setSaveStatus] = useState(
    demo ? "虚构案例不会保存" : boot.error || (boot.persist ? "已恢复本地会话" : "本次会话不保留"),
  );
  const update = (fn: (d: SessionData) => SessionData) =>
    setData((d) => ({ ...fn(d), updatedAt: new Date().toISOString() }));
  const changePersist = (value: boolean) => {
    persistRef.current = value;
    setPersistValue(value);
  };
  const pause = () => {
    blocked.current = true;
    changePersist(false);
    setConflict(true);
    setSaveStatus("此窗口已暂停本地保存");
  };
  useEffect(() => {
    if (demo || !persist) return;
    let canceled = false;
    // Merely opening an existing saved copy must not write anything.
    if (boot.persist && data === boot.data && !bootEdited.current) return;
    void withSessionStorageLock(() => {
      if (canceled || !persistRef.current || blocked.current) return;
      if (!guard.write(localStorage, JSON.stringify(data))) {
        pause();
        return;
      }
      setSaveStatus("已保存到此浏览器");
    }, navigator.locks).catch(() => {
      if (!canceled && persistRef.current && !blocked.current) {
        setSaveStatus("本地保存失败，请导出会话备份");
      }
    });
    return () => { canceled = true; };
  }, [data, persist, demo, guard, boot]);
  useEffect(() => {
    if (demo) return;
    const onStorage = (e: StorageEvent) => {
      if (!persistRef.current || blocked.current || (e.key !== STORAGE_KEY && e.key !== null)) return;
      try {
        if (e.storageArea === localStorage && guard.changed(localStorage)) pause();
      } catch {
        setSaveStatus("无法检查本地记录，请导出会话备份");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [demo, guard]);
  useEffect(() => {
    if (demo) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (!persist && (data.theme || data.constructs.length)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [persist, data.theme, data.constructs.length, demo]);
  const setPersist = (v: boolean) => {
    if (demo || blocked.current || pending.current) return;
    bootEdited.current = true;
    if (v) {
      changePersist(true);
      setSaveStatus("正在保存…");
      return;
    }
    // Prevent any queued autosave from recreating the copy while opting out.
    changePersist(false);
    pending.current = true;
    setPending(true);
    setSaveStatus("正在关闭本地保存…");
    void withSessionStorageLock(() => {
      if (!guard.remove(localStorage)) {
        pause();
        return;
      }
      setSaveStatus("本次会话不保留");
    }, navigator.locks).catch(() => {
      setSaveStatus("未能删除浏览器副本，请在浏览器中清除此站点数据");
    }).finally(() => {
      pending.current = false;
      setPending(false);
    });
  };
  return (
    <SessionContext.Provider
      value={{
        data,
        update,
        replace: setData,
        persist,
        setPersist,
        saveStatus,
        saveConflict,
        savePending,
        reset: () => setData(freshSession()),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Missing session provider");
  return value;
}
