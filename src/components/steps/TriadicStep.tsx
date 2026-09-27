import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, RefreshCw, Plus, Check } from "lucide-react";
import { useSession } from "../../SessionContext";
import { generateId } from "../../lib/utils";
import type { Construct } from "../../types";
import { useConfirm } from "../ConfirmDialog";
export default function TriadicStep({
  onNext,
  onPrev,
}: {
  onNext: () => void;
  onPrev: () => void;
}) {
  const { data, update } = useSession();
  const history = useRef(new Set<string>(data.seenTriads || []));
  const pick = () => {
    const combinations: string[][] = [];
    const es = data.elements;
    for (let a = 0; a < es.length - 2; a++)
      for (let b = a + 1; b < es.length - 1; b++)
        for (let c = b + 1; c < es.length; c++) {
          const ids = [es[a].id, es[b].id, es[c].id];
          if (!history.current.has(ids.slice().sort().join("|")))
            combinations.push(ids);
        }
    if (!combinations.length) {
      history.current.clear();
      return es.slice(0, 3).map((e) => e.id);
    }
    return combinations[Math.floor(Math.random() * combinations.length)];
  };
  const draft =
    data.triadDraft &&
    data.triadDraft.ids.every((id) => data.elements.some((e) => e.id === id))
      ? data.triadDraft
      : undefined;
  const [triad, setTriad] = useState(() => draft?.ids || pick()),
    [pair, setPair] = useState<string[]>(draft?.pair || []),
    [left, setLeft] = useState(draft?.left || ""),
    [right, setRight] = useState(draft?.right || ""),
    [example, setExample] = useState(draft?.example || ""),
    [editing, setEditing] = useState<string | null>(draft?.editing || null),
    [message, setMessage] = useState(""),
    [undo, setUndo] = useState<{ c: Construct; row: any } | null>(null);
  useEffect(() => {
    update((d) => ({
      ...d,
      triadDraft: { ids: triad, pair, left, right, example, editing },
      seenTriads: [...history.current],
    }));
  }, [triad, pair, left, right, example, editing]);
  const draw = () => {
    history.current.add(triad.slice().sort().join("|"));
    setTriad(pick());
    setPair([]);
    setLeft("");
    setRight("");
    setExample("");
    setEditing(null);
  };
  const ask = useConfirm();
  const save = async () => {
    const l = left.trim(),
      r = right.trim();
    if (!l || !r || l === r) {
      setMessage("请用两个不同的描述，表达对你有意义的区别。");
      return;
    }
    if (
      data.constructs.some(
        (c) =>
          c.id !== editing &&
          ((c.leftPole === l && c.rightPole === r) ||
            (c.leftPole === r && c.rightPole === l)),
      )
    ) {
      setMessage("已有相同或相反顺序的构念，可以继续澄清原有描述。");
      return;
    }
    const previous = data.constructs.find((c) => c.id === editing);
    const changed =
      previous && (previous.leftPole !== l || previous.rightPole !== r);
    if (
      changed &&
      Object.keys(data.ratings[editing!] || {}).length &&
      !(
        await ask({
          title: "修改构念含义",
          message:
            "这一组已有评分会清除，需要重新评分。其他构念的评分不受影响。",
          confirmLabel: "修改并重新评分",
        })
      ).confirmed
    )
      return;
    update((d) => {
      const ratings = { ...d.ratings };
      if (changed) delete ratings[editing!];
      return {
        ...d,
        constructs: editing
          ? d.constructs.map((c) =>
              c.id === editing
                ? { ...c, leftPole: l, rightPole: r, example }
                : c,
            )
          : [
              ...d.constructs,
              { id: generateId(), leftPole: l, rightPole: r, example },
            ],
        ratings,
        feedback: {},
      };
    });
    setMessage(
      editing
        ? "构念已更新。"
        : "已记下这组构念。可以继续比较，也可以进入评分。",
    );
    draw();
  };
  const edit = (c: Construct) => {
    setEditing(c.id);
    setLeft(c.leftPole);
    setRight(c.rightPole);
    setExample(c.example || "");
    setMessage("修改描述会影响它的含义；只修改例子不会清除评分。");
    window.scrollTo({ top: 0 });
  };
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">没有标准词汇，用你自己的语言</div>
        <h1>你看见了怎样的区别？</h1>
        <p className="lead">
          选出两位有共同点的人，再描述另一位与他们不同的地方。
        </p>
      </div>
      <div className="split-layout wide-main">
        <section className="panel">
          {editing ? (
            <div className="notice">
              正在编辑构念
              <button className="quiet" onClick={draw}>
                取消编辑
              </button>
            </div>
          ) : (
            <>
              <div className="section-heading">
                <h2>先选择相似的两位</h2>
                <span className="small muted">{pair.length} / 2 已选</span>
              </div>
              <div className="triad-grid">
                {triad.map((id) => {
                  const e = data.elements.find((e) => e.id === id)!;
                  return (
                    <button
                      key={id}
                      aria-pressed={pair.includes(id)}
                      className={
                        "triad-card " + (pair.includes(id) ? "selected" : "")
                      }
                      onClick={() =>
                        setPair((p) =>
                          p.includes(id)
                            ? p.filter((x) => x !== id)
                            : p.length < 2
                              ? [...p, id]
                              : [p[0], id],
                        )
                      }
                    >
                      <span className="triad-icon">
                        {pair.includes(id) ? <Check size={19} /> : "○"}
                      </span>
                      <strong>{e.name}</strong>
                      <span>
                        {pair.includes(id)
                          ? "相似的一位"
                          : pair.length === 2
                            ? "不同的一位"
                            : "点击选择"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                className="quiet"
                onClick={async () => {
                  if (
                    (left || right || example) &&
                    !(
                      await ask({
                        title: "换一组人物",
                        message: "换组会清空尚未记下的构念描述。",
                        confirmLabel: "换一组",
                      })
                    ).confirmed
                  )
                    return;
                  draw();
                }}
              >
                <RefreshCw size={16} />
                想不到区别？跳过，换一组
              </button>
              {data.scenario === "consultation" && (
                <details className="field">
                  <summary>咨询师手动选择三位</summary>
                  <div className="manual-triad">
                    {triad.map((id, i) => (
                      <label key={i}>
                        位置 {i + 1}
                        <select
                          value={id}
                          onChange={(e) => {
                            const ids = [...triad];
                            ids[i] = e.target.value;
                            setTriad(ids);
                            setPair([]);
                          }}
                        >
                          {data.elements.map((e) => (
                            <option
                              key={e.id}
                              value={e.id}
                              disabled={triad.includes(e.id) && id !== e.id}
                            >
                              {e.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
          <fieldset
            disabled={!editing && pair.length !== 2}
            className="construct-fields"
          >
            <legend className="sr-only">构念两极与例子</legend>
            <label>
              这两位的共同特点
              <input
                maxLength={100}
                value={left}
                onChange={(e) => setLeft(e.target.value)}
                placeholder="用你自己的话描述"
              />
            </label>
            <label>
              另一位与他们不同的特点
              <input
                maxLength={100}
                value={right}
                onChange={(e) => setRight(e.target.value)}
                placeholder="不必是字典里的反义词"
              />
            </label>
            <label>
              一个具体例子（可选）
              <textarea
                rows={3}
                maxLength={2000}
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="什么情境或行为，让你这样描述？"
              />
            </label>
          </fieldset>
          {data.mode === "guided" && (
            <details>
              <summary>如何把描述说得更清楚</summary>
              <p>
                可以回想一次具体相处：他们做了什么？你看重其中什么？两端是否在描述同一个方面？两端都可能有价值，不必把一端写成优点、另一端写成缺点。
              </p>
            </details>
          )}
          <button
            className="primary full field"
            disabled={
              (!editing && pair.length !== 2) ||
              !left.trim() ||
              !right.trim() ||
              (!editing && data.constructs.length >= 40)
            }
            onClick={save}
          >
            <Plus size={18} />
            {editing ? "保存修改" : "记下这组构念"}
          </button>
          <p className="small" role="status">
            {message}
          </p>
        </section>
        <aside className="panel construct-list">
          <div className="section-heading">
            <h2>我的构念</h2>
            <span className="pill">{data.constructs.length} 组</span>
          </div>
          {!data.constructs.length && (
            <div className="empty-state">
              每个人都有自己的标尺。
              <br />
              你发现的区别会收在这里。
            </div>
          )}
          {data.constructs.map((c, i) => (
            <article className="construct-item" key={c.id}>
              <span className="eyebrow">
                构念 {String(i + 1).padStart(2, "0")}
              </span>
              <p>
                <strong>{c.leftPole}</strong>
                <span className="muted"> ↔ </span>
                <strong>{c.rightPole}</strong>
              </p>
              {c.example && <p className="small muted">{c.example}</p>}
              <div className="actions">
                <button
                  className="quiet"
                  onClick={() => edit(c)}
                  aria-label={"编辑构念 " + (i + 1)}
                >
                  编辑
                </button>
                <button
                  className="quiet"
                  onClick={() => {
                    setUndo({ c, row: data.ratings[c.id] });
                    if (editing === c.id) draw();
                    update((d) => {
                      const ratings = { ...d.ratings };
                      delete ratings[c.id];
                      return {
                        ...d,
                        constructs: d.constructs.filter((x) => x.id !== c.id),
                        ratings,
                        feedback: {},
                      };
                    });
                  }}
                  aria-label={"移除构念 " + (i + 1)}
                >
                  移除
                </button>
              </div>
            </article>
          ))}
          {undo && (
            <button
              className="secondary full"
              onClick={() => {
                update((d) => ({
                  ...d,
                  constructs: [...d.constructs, undo.c],
                  ratings: undo.row
                    ? { ...d.ratings, [undo.c.id]: undo.row }
                    : d.ratings,
                }));
                setUndo(null);
              }}
            >
              撤销最近一次移除
            </button>
          )}
          <p className="small muted field">
            可以先用少量构念熟悉流程，再逐步补充。数量本身不保证结果可靠。
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
          disabled={!data.constructs.length}
          onClick={onNext}
        >
          进入评分 <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
