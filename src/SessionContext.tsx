import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SessionData } from "./types";
import { freshSession, parseSession, STORAGE_KEY } from "./lib/session";
function initial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      data: raw ? parseSession(raw) : freshSession(),
      persist: !!raw,
      error: "",
    };
  } catch {
    return {
      data: freshSession(),
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
  reset: () => void;
} | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(initial),
    [data, setData] = useState(boot.data),
    [persist, setPersistValue] = useState(boot.persist);
  const [saveStatus, setSaveStatus] = useState(
    boot.error || (boot.persist ? "已恢复本地会话" : "本次会话不保留"),
  );
  const update = (fn: (d: SessionData) => SessionData) =>
    setData((d) => ({ ...fn(d), updatedAt: new Date().toISOString() }));
  useEffect(() => {
    if (!persist) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveStatus("已保存到此浏览器");
    } catch {
      setSaveStatus("本地保存失败，请导出会话备份");
    }
  }, [data, persist]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!persist && (data.theme || data.constructs.length)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [persist, data.theme, data.constructs.length]);
  const setPersist = (v: boolean) => {
    if (!v) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        setSaveStatus("未能删除浏览器副本，请在浏览器中清除此站点数据");
        return;
      }
    }
    setPersistValue(v);
    setSaveStatus(v ? "正在保存…" : "本次会话不保留");
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
