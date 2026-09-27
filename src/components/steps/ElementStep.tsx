import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  UserRound,
  LockKeyhole,
} from "lucide-react";
import { useSession } from "../../SessionContext";
import { generateId } from "../../lib/utils";
import { useConfirm } from "../ConfirmDialog";
export default function ElementStep({
  onNext,
  onPrev,
}: {
  onNext: () => void;
  onPrev: () => void;
}) {
  const { data, update } = useSession();
  const [name, setName] = useState(""),
    [error, setError] = useState("");
  const add = (e: FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    if (data.elements.some((x) => x.name === clean)) {
      setError("这个名称已经在列表中，请用不同代号区分人物。");
      return;
    }
    update((d) => ({
      ...d,
      elements: [
        ...d.elements,
        { id: generateId(), name: clean, role: "other", isCustom: true },
      ],
    }));
    setName("");
    setError("");
  };
  const ask = useConfirm();
  const remove = async (id: string) => {
    if (
      !(
        await ask({
          title: "移除人物",
          message: "这个人物及其已有评分将被移除。",
          confirmLabel: "移除",
        })
      ).confirmed
    )
      return;
    update((d) => ({
      ...d,
      elements: d.elements.filter((e) => e.id !== id),
      ratings: Object.fromEntries(
        Object.entries(d.ratings).map(([cid, row]) => [
          cid,
          Object.fromEntries(Object.entries(row).filter(([eid]) => eid !== id)),
        ]),
      ),
      feedback: {},
    }));
  };
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">选择与你的主题有关的人</div>
        <h1>从熟悉的面孔开始。</h1>
        <p className="lead">
          围绕「{data.theme}」，想一想你熟悉、也愿意讨论的人物或自我状态。
        </p>
      </div>
      <div className="split-layout">
        <section className="panel">
          <div className="section-heading">
            <h2>本次人物清单</h2>
            <span className="pill">{data.elements.length} 位</span>
          </div>
          <div className="element-list">
            {data.elements.map((e) => (
              <div className="element-row" key={e.id}>
                <span
                  className={"avatar " + (e.role === "ideal" ? "sage" : "")}
                >
                  <UserRound size={20} />
                </span>
                <div>
                  <strong>{e.name}</strong>
                  <span className="small muted">
                    {e.role === "self"
                      ? "此刻，你如何理解自己"
                      : e.role === "ideal"
                        ? "你希望成为的自己"
                        : "以你的经验和理解为准"}
                  </span>
                </div>
                {e.role !== "other" ? (
                  <LockKeyhole size={16} className="muted" />
                ) : (
                  <button
                    className="quiet"
                    aria-label={"移除 " + e.name}
                    onClick={() => remove(e.id)}
                  >
                    移除
                  </button>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={add} className="field">
            <label htmlFor="person-name">添加人物或状态（建议使用代号）</label>
            <div className="input-action">
              <input
                id="person-name"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：同事 A、熟悉的朋友"
              />
              <button
                className="secondary"
                disabled={!name.trim() || data.elements.length >= 40}
              >
                <Plus size={18} />
                添加
              </button>
            </div>
          </form>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </section>
        <aside className="panel soft">
          <h2>哪些人适合放进来？</h2>
          <p>
            选择与同一主题有关、你足够熟悉的人。可以有相似的人，也有不同的人，不必刻意凑齐“正面”和“负面”角色。
          </p>
          <details>
            <summary>需要一些人物线索</summary>
            <ul>
              <li>相处自在的人</li>
              <li>与你看法不同的人</li>
              <li>你欣赏或想进一步理解的人</li>
              <li>某个时期的自己</li>
            </ul>
            <p className="small">线索只帮助回想，不会自动加入列表。</p>
          </details>
          <div className="divider" />
          <p className="small">
            至少 3 个元素可开始比较。通常 6–10
            个更便于探索，这是操作建议，不是效度保证。增加元素也会增加评分工作量。
          </p>
        </aside>
      </div>
      <div className="step-footer">
        <button className="secondary" onClick={onPrev}>
          <ArrowLeft size={18} />
          上一步
        </button>
        <button
          className="primary"
          disabled={data.elements.length < 3}
          onClick={onNext}
        >
          开始比较 <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
