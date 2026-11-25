import { useRef, useState, type ChangeEvent } from "react";
import {
  Compass,
  Download,
  Upload,
  NotebookPen,
  RotateCcw,
  Check,
  ChevronRight,
} from "lucide-react";
import { SessionProvider, useSession } from "./SessionContext";
import AppInstall from "./components/AppInstall";
import { demoSession } from "./lib/demo";
import { downloadJSON, parseSession } from "./lib/session";
import IntroStep from "./components/steps/IntroStep";
import ElementStep from "./components/steps/ElementStep";
import TriadicStep from "./components/steps/TriadicStep";
import RatingStep from "./components/steps/RatingStep";
import AnalysisStep from "./components/steps/AnalysisStep";
import { ConfirmProvider, useConfirm } from "./components/ConfirmDialog";

const steps = ["探索主题", "选择人物", "发现构念", "细致评分", "回看与行动"];
function Workspace({ isDemo = false, onDemo }: { isDemo?: boolean; onDemo: () => void }) {
  const ask = useConfirm();
  const { data, update, replace, persist, setPersist, saveStatus, saveConflict, savePending, reset } =
    useSession();
  const [message, setMessage] = useState(""),
    [notesOpen, setNotesOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const go = (step: number) => {
    update((d) => ({ ...d, step }));
    setNotesOpen(false);
    window.scrollTo({ top: 0 });
  };
  const canGo = (i: number) =>
    i === 0 ||
    (!!data.theme.trim() &&
      (i === 1 ||
        (data.elements.length >= 3 &&
          (i === 2 || data.constructs.length > 0))));
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 2_000_000)
        throw new Error("文件过大，请选择本工具导出的会话。");
      const next = parseSession(await file.text());
      if (
        (data.theme || data.constructs.length) &&
        !(
          await ask({
            title: "替换当前会话",
            message: "导入会替换当前会话。请先导出需要保留的内容。",
            confirmLabel: "替换并导入",
          })
        ).confirmed
      )
        return;
      replace(next);
      setNotesOpen(false);
      setMessage("会话已导入。");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "无法读取文件。");
    }
  };
  const exportSession = async () => {
    const choice = await ask({
      title: "导出会话备份",
      message:
        "备份包含人物、构念、评分、反馈及行动记录。请妥善保管文件。私人笔记默认不纳入。",
      confirmLabel: "下载备份",
      notesOption: data.scenario === "consultation" && !!data.notes,
    });
    if (!choice.confirmed) return;
    const include = choice.includeNotes;
    downloadJSON({ ...data, notes: include ? data.notes : "" });
    setMessage(
      include
        ? "已导出包含私人笔记的会话。请妥善保管。"
        : "已导出会话，未包含私人笔记。",
    );
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <header className="app-header">
        <a href="#main" className="brand">
          <span className="brand-mark">
            <Compass size={24} />
          </span>
          <span>
            心格<span className="brand-en">MINDGRID</span>
          </span>
        </a>
        <span className="header-caption">个人构念探索</span>
        <div className="header-actions">
          {isDemo ? <button className="primary" onClick={onDemo}>退出案例</button> : <>
          <AppInstall />
          <button className="quiet" onClick={() => input.current?.click()}>
            <Upload size={17} />
            <span>导入</span>
          </button>
          <button className="quiet" onClick={exportSession}>
            <Download size={17} />
            <span>备份</span>
          </button>
          <button
            className="quiet"
            onClick={async () => {
              if (
                (
                  await ask({
                    title: "开始新的探索",
                    message: "当前会话将被清空。如需保留，请先导出备份。",
                    confirmLabel: "清空并开始",
                  })
                ).confirmed
              ) {
                reset();
                setNotesOpen(false);
                setMessage("已开始新的会话。");
              }
            }}
          >
            <RotateCcw size={17} />
            <span>新会话</span>
          </button>
          </>}
        </div>
        <input
          hidden
          ref={input}
          type="file"
          accept=".json,application/json"
          onChange={importFile}
          aria-label="导入会话文件"
        />
      </header>
      <div className="workspace">
        <aside className="journey no-print" aria-label="探索步骤">
          <div className="eyebrow">一次理解自己的练习</div>
          <nav>
            {steps.map((name, i) => (
              <button
                key={name}
                className={"step-link " + (data.step === i ? "active" : "")}
                aria-current={data.step === i ? "step" : undefined}
                disabled={!canGo(i)}
                onClick={() => go(i)}
              >
                <span className="step-number">
                  {data.step > i ? <Check size={16} /> : "0" + (i + 1)}
                </span>
                <span>{name}</span>
                {data.step === i && <ChevronRight size={16} />}
              </button>
            ))}
          </nav>
          <div className="journey-note">
            <p>你可以慢慢来。</p>
            <span>这里没有标准答案。每一组描述，都由你赋予意义。</span>
          </div>
          {!isDemo && <div className="storage-box">
            <label className="check-label">
              <input
                type="checkbox"
                checked={persist}
                disabled={savePending || saveConflict}
                onChange={(e) => setPersist(e.target.checked)}
              />
              在此设备保留进度
            </label>
            <p className="small" role="status">
              {saveStatus}
            </p>
            <p className="small muted">
              共用设备建议关闭。浏览器保存未加密；关闭会移除此处副本。跨设备请使用会话备份。
            </p>
          </div>}
        </aside>
        <main id="main" tabIndex={-1}>
          <div className="workspace-meta no-print">
            <span>
              第 {data.step + 1} / 5 步 · {steps[data.step]}
            </span>
            <span className="pill">
              {data.scenario === "personal" ? "个人探索" : "咨询协作"}
            </span>
          </div>
          {!isDemo && saveConflict && <div className="notice save-conflict no-print" role="alert">
            <div><strong>已暂停本地保存</strong><p>另一窗口更新或移除了浏览器里的记录。此窗口的编辑仍在当前页面，不会覆盖或恢复那份记录。请先备份，再刷新页面读取此浏览器目前的记录。</p></div>
            <button className="secondary" onClick={exportSession}>备份当前编辑</button>
          </div>}
          {isDemo && <div className="notice demo-notice no-print"><div>
            <strong>虚构案例 · 不会保存</strong>
            <p>先看「探索线索」，再返回评分改动一项，看看关联会不会变化。退出后回到你原来的会话。</p>
          </div></div>}
          {message && (
            <div className="notice no-print" role="status">
              {message}
              <button
                className="quiet"
                onClick={() => setMessage("")}
                aria-label="关闭提示"
              >
                ×
              </button>
            </div>
          )}
          {data.step === 0 && <IntroStep onNext={() => go(1)} onDemo={isDemo ? undefined : onDemo} />}
          {data.step === 1 && (
            <ElementStep onNext={() => go(2)} onPrev={() => go(0)} />
          )}
          {data.step === 2 && (
            <TriadicStep onNext={() => go(3)} onPrev={() => go(1)} />
          )}
          {data.step === 3 && (
            <RatingStep onNext={() => go(4)} onPrev={() => go(2)} />
          )}
          {data.step === 4 && <AnalysisStep onPrev={() => go(3)} />}
          {data.scenario === "consultation" && (
            <section className="notes-panel no-print">
              <button
                className="quiet"
                aria-expanded={notesOpen}
                onClick={() => setNotesOpen((v) => !v)}
              >
                <NotebookPen size={18} />
                {notesOpen ? "收起笔记，返回共同观看" : "打开咨询师私人笔记"}
              </button>
              {notesOpen && (
                <>
                  <p className="small">
                    共同观看时请收起。报告默认不纳入笔记；此区域只是界面隐藏，并非访问加密。
                  </p>
                  <label>
                    会谈观察与待核对的假设
                    <textarea
                      maxLength={10000}
                      rows={5}
                      value={data.notes}
                      onChange={(e) =>
                        update((d) => ({ ...d, notes: e.target.value }))
                      }
                    />
                  </label>
                </>
              )}
            </section>
          )}
          <footer className="page-footer no-print">
            <span>基于个人构念心理学 · PCP</span>
            <span>用于探索与对话，不提供诊断</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function AppWorkspaces() {
  const [isDemo, setIsDemo] = useState(false);
  const toggle = () => {
    setIsDemo(v => !v);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => document.getElementById("main")?.focus({ preventScroll: true }));
  };
  return isDemo
    ? <SessionProvider demo={demoSession}><Workspace isDemo onDemo={toggle} /></SessionProvider>
    : <Workspace onDemo={toggle} />;
}

export default function App() {
  return (
    <ConfirmProvider>
      <SessionProvider>
        <AppWorkspaces />
      </SessionProvider>
    </ConfirmProvider>
  );
}
