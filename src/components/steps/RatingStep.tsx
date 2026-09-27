import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useSession } from "../../SessionContext";
import type { Rating } from "../../types";
export default function RatingStep({
  onNext,
  onPrev,
}: {
  onNext: () => void;
  onPrev: () => void;
}) {
  const { data, update } = useSession();
  const [active, setActive] = useState(0),
    [card, setCard] = useState(0);
  const element = data.elements[active] || data.elements[0];
  const answered = (id: string) =>
    data.constructs.filter((c) => data.ratings[c.id]?.[id] !== undefined)
      .length;
  const total = data.elements.length * data.constructs.length,
    done = data.elements.reduce((n, e) => n + answered(e.id), 0);
  const rate = (cid: string, value: Rating | undefined) =>
    update((d) => {
      const row = { ...d.ratings[cid] };
      if (value === undefined) delete row[element.id];
      else row[element.id] = value;
      return { ...d, ratings: { ...d.ratings, [cid]: row }, feedback: {} };
    });
  const missing = () => {
    for (let i = 0; i < data.elements.length; i++)
      for (let j = 0; j < data.constructs.length; j++)
        if (
          data.ratings[data.constructs[j].id]?.[data.elements[i].id] ===
          undefined
        ) {
          setActive(i);
          setCard(j);
          setTimeout(
            () =>
              document
                .getElementById("rating-" + j)
                ?.scrollIntoView({ block: "center" }),
            0,
          );
          return;
        }
  };
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">只依据你现在的理解</div>
        <h1>把你的感受，放在标尺上。</h1>
        <p className="lead">
          1 靠近左端，7 靠近右端。4 是中间位置；不了解时，可以如实记录。
        </p>
      </div>
      <div className="progress-row">
        <span>
          已回应 {done} / {total} 项
        </span>
        <progress value={done} max={total} aria-label="评分完成进度" />
        <button className="quiet" disabled={done === total} onClick={missing}>
          定位未评分项
        </button>
      </div>
      <div className="rating-layout">
        <aside className="panel rating-people">
          <h2>当前人物</h2>
          <label className="mobile-person">
            切换人物
            <select
              value={element.id}
              onChange={(e) => {
                setActive(
                  data.elements.findIndex((x) => x.id === e.target.value),
                );
                setCard(0);
              }}
            >
              {data.elements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {answered(e.id)}/{data.constructs.length}
                </option>
              ))}
            </select>
          </label>
          <div className="desktop-people">
            {data.elements.map((e, i) => (
              <button
                key={e.id}
                className={"person-button " + (i === active ? "selected" : "")}
                onClick={() => {
                  setActive(i);
                  setCard(0);
                }}
              >
                <span>{e.name}</span>
                <span className="small">
                  {answered(e.id) === data.constructs.length ? (
                    <Check size={17} />
                  ) : (
                    answered(e.id) + "/" + data.constructs.length
                  )}
                </span>
              </button>
            ))}
          </div>
        </aside>
        <section className="panel">
          <div className="section-heading">
            <h2>{element.name}</h2>
            <span className="pill">按构念评分</span>
          </div>
          <div className="mobile-card-nav">
            <button
              className="quiet"
              disabled={card === 0}
              onClick={() => setCard((x) => x - 1)}
            >
              上一组
            </button>
            <span>
              {card + 1} / {data.constructs.length} 组
            </span>
            <button
              className="quiet"
              disabled={card === data.constructs.length - 1}
              onClick={() => setCard((x) => x + 1)}
            >
              下一组
            </button>
          </div>
          {data.constructs.map((c, i) => {
            const value = data.ratings[c.id]?.[element.id];
            return (
              <fieldset
                id={"rating-" + i}
                key={c.id}
                className={"rating-card " + (card === i ? "current-card" : "")}
              >
                <legend>
                  <span className="eyebrow">构念 {i + 1}</span>
                  <span className="rating-poles">
                    <span>{c.leftPole}</span>
                    <span className="muted">↔</span>
                    <span>{c.rightPole}</span>
                  </span>
                </legend>
                {c.example && (
                  <details className="small">
                    <summary>回看具体例子</summary>
                    <p>{c.example}</p>
                  </details>
                )}
                <div className="score-options">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <label
                      key={n}
                      className={
                        "score-option " + (value === n ? "chosen" : "")
                      }
                    >
                      <input
                        type="radio"
                        name={c.id + "-" + element.id}
                        value={n}
                        checked={value === n}
                        onChange={() => rate(c.id, n)}
                        aria-label={
                          n +
                          " 分，" +
                          (n < 4
                            ? "靠近 " + c.leftPole
                            : n > 4
                              ? "靠近 " + c.rightPole
                              : "中间位置")
                        }
                      />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
                <div className="scale-captions">
                  <span>靠近左端</span>
                  <span>中间位置</span>
                  <span>靠近右端</span>
                </div>
                <div className="rating-extras">
                  <button
                    className={
                      "chip " + (value === "unknown" ? "selected" : "")
                    }
                    aria-pressed={value === "unknown"}
                    onClick={() => rate(c.id, "unknown")}
                  >
                    不了解
                  </button>
                  <button
                    className={"chip " + (value === "skip" ? "selected" : "")}
                    aria-pressed={value === "skip"}
                    onClick={() => rate(c.id, "skip")}
                  >
                    暂不评分
                  </button>
                  <button
                    className="quiet"
                    disabled={value === undefined}
                    onClick={() => rate(c.id, undefined)}
                  >
                    清除
                  </button>
                  <span className="small" role="status">
                    {value === undefined
                      ? "尚未评分"
                      : typeof value === "number"
                        ? "已选 " + value + " 分"
                        : value === "unknown"
                          ? "已记录：不了解"
                          : "已记录：暂不评分"}
                  </span>
                </div>
              </fieldset>
            );
          })}
          <div className="panel-bottom">
            <button
              className="secondary"
              disabled={active === 0}
              onClick={() => {
                setActive((x) => x - 1);
                setCard(0);
              }}
            >
              上一位
            </button>
            <button
              className="secondary"
              disabled={active === data.elements.length - 1}
              onClick={() => {
                setActive((x) => x + 1);
                setCard(0);
              }}
            >
              下一位 <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </div>
      <p className="small muted">
        不了解、暂不评分与未评分均不参与数值计算。你可以先回看已有结果；数据不足时会明确提示。
      </p>
      <div className="step-footer">
        <button className="secondary" onClick={onPrev}>
          <ArrowLeft size={18} />
          修改构念
        </button>
        <button className="primary" onClick={onNext}>
          回看与行动 <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
