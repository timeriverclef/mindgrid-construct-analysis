import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  MessageCircle,
  ArrowRight,
  Clipboard,
  BookOpen,
} from "lucide-react";
import { useSession } from "../../SessionContext";
import { analyzeGrid, isScore } from "../../lib/utils";
import { aiText, downloadReport } from "../../lib/report";
const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(2));
const feedbacks = ["符合我的体验", "部分符合", "不符合", "暂不确定"];
export default function AnalysisStep({ onPrev }: { onPrev: () => void }) {
  const { data, update } = useSession();
  const a = useMemo(
    () =>
      analyzeGrid(data.elements, data.constructs, data.ratings, data.settings),
    [data],
  );
  const [notes, setNotes] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [pseudo, setPseudo] = useState(true);
  const ideal = data.elements.find((e) => e.role === "ideal")!;
  const prompt = useMemo(() => aiText(data, pseudo), [data, pseudo]);
  const setting = (key: string, value: number | boolean) =>
    update((d) => ({
      ...d,
      settings: { ...d.settings, [key]: value },
      feedback: {},
    }));
  return (
    <div className="stack">
      <div className="report-title">
        <div>
          <div className="eyebrow">先看见，再一起理解</div>
          <h1>你的探索，值得慢慢回看。</h1>
          <p className="lead">{data.theme}</p>
        </div>
        <button
          className="primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await downloadReport(data, notes);
              setMessage("PDF 已生成，包含原始评分和本次分析规则。");
            } catch {
              setMessage("PDF 生成失败，请重试或先导出会话备份。");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={18} />
          {busy ? "正在生成…" : "下载 PDF"}
        </button>
      </div>
      {data.scenario === "consultation" && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={notes}
            onChange={(e) => setNotes(e.target.checked)}
          />
          本次 PDF 纳入咨询师私人笔记（默认不纳入）
        </label>
      )}
      <p className="small" role="status">
        {message}
      </p>
      <section className="panel soft">
        <div className="section-heading">
          <h2>这份记录如何阅读</h2>
          <span className="pill">
            {a.valid} / {a.total} 项有效评分
          </span>
        </div>
        <p>
          这些观察来自你选择的人物、构念与本次评分。它们帮助提出问题，不能证明心理原因，也不用于判断你是否“健康”。
        </p>
        {(a.valid < a.total ||
          data.elements.length < 6 ||
          data.constructs.length < 3) && (
          <p className="notice">
            当前数据较少或存在未评分项，请优先回看原始描述。少量元素产生的相关可能不稳定。
          </p>
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <span className="section-index">01</span>
          <h2>先记下你自己的发现</h2>
        </div>
        <label>
          哪些描述最贴近你？哪些地方需要重新理解？
          <textarea
            rows={3}
            maxLength={10000}
            value={data.reflection}
            onChange={(e) =>
              update((d) => ({ ...d, reflection: e.target.value }))
            }
            placeholder="不必先接受系统的解释。你可以写下例外、疑问或新的发现。"
          />
        </label>
      </section>
      <section className="panel">
        <div className="section-heading">
          <span className="section-index">02</span>
          <h2>值得核对的联系</h2>
          <MessageCircle size={21} />
        </div>
        <p>
          当某个想改变的方面，与另一个想保留的方面在评分中有关联时，可以进一步讨论：改变是否让你担心失去什么？
        </p>
        {!a.dilemmas.length ? (
          <div className="empty-state">
            本次网格与当前规则下，未发现符合条件的联系。
            <p className="small">
              这不代表生活中没有矛盾。也可以从你自己的发现继续探索。
            </p>
          </div>
        ) : (
          a.dilemmas.map((d, i) => {
            const dc = data.constructs.find(
                (c) => c.id === d.differenceConstructId,
              )!,
              cc = data.constructs.find(
                (c) => c.id === d.consistentConstructId,
              )!;
            const wanted =
              (data.ratings[dc.id][ideal.id] as number) > 4
                ? dc.rightPole
                : dc.leftPole;
            const valued =
              (data.ratings[cc.id][ideal.id] as number) > 4
                ? cc.rightPole
                : cc.leftPole;
            const key = dc.id + "|" + cc.id;
            return (
              <article className="dilemma-card" key={key}>
                <div className="eyebrow">
                  探索线索 {i + 1} · r = {d.correlation.toFixed(2)} · 有效配对{" "}
                  {d.n}
                </div>
                <div className="dilemma-poles">
                  <div>
                    <span>希望更靠近</span>
                    <strong>{wanted}</strong>
                  </div>
                  <ArrowRight size={20} />
                  <div>
                    <span>同时想保留</span>
                    <strong>{valued}</strong>
                  </div>
                </div>
                <p>
                  当你更接近「{wanted}」时，你是否担心「{valued}
                  」会受到影响？也可能存在其他解释。
                </p>
                <fieldset className="feedback">
                  <legend>这条线索符合你的体验吗？</legend>
                  {feedbacks.map((f) => (
                    <label
                      key={f}
                      className={
                        "chip " + (data.feedback[key] === f ? "selected" : "")
                      }
                    >
                      <input
                        type="radio"
                        name={key}
                        checked={data.feedback[key] === f}
                        onChange={() =>
                          update((s) => ({
                            ...s,
                            feedback: { ...s.feedback, [key]: f },
                          }))
                        }
                      />
                      {f}
                    </label>
                  ))}
                </fieldset>
              </article>
            );
          })
        )}
        <p className="small muted">
          已计算 {a.testedPairs} 个候选构念对；{a.unavailablePairs} 对因少于 3
          个有效配对或评分无变化而无法计算。相关阈值不是统计显著性或因果证据。
        </p>
      </section>
      <section className="panel">
        <div className="section-heading">
          <span className="section-index">03</span>
          <h2>描述性观察</h2>
        </div>
        <div className="metrics-grid">
          <div className="metric">
            <span>自我—理想平均差</span>
            <strong>
              {fmt(a.selfDistance)}
              <small> / 6</small>
            </strong>
            <p>{a.selfPairs} 对有效评分的绝对差；越小表示本次评分越接近。</p>
          </div>
          <div className="metric">
            <span>自我—理想评分模式相关</span>
            <strong>{fmt(a.selfEsteemCorrelation)}</strong>
            <p>
              反映评分模式，不等同于自尊。受构念两极编码影响；不用于跨人比较。
            </p>
          </div>
          <div className="metric">
            <span>端点评分占比</span>
            <strong>
              {a.polarizationRatio === null
                ? "—"
                : (a.polarizationRatio * 100).toFixed(1)}
              <small> %</small>
            </strong>
            <p>1 或 7 分占有效评分的比例，不能单独推断思维僵化。</p>
          </div>
          <div className="metric">
            <span>自我—其他元素平均差</span>
            <strong>
              {fmt(a.perceivedSocialDistance)}
              <small> / 6</small>
            </strong>
            <p>
              {a.socialPairs} 对有效评分的绝对差；不等同于社交孤立或关系质量。
            </p>
          </div>
        </div>
        <p className="small muted">“—”表示数据不足或数值无法定义，不等于 0。</p>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>回看完整评分</h2>
          <button className="quiet" onClick={onPrev}>
            修改评分
          </button>
        </div>
        <p className="small muted">
          1 靠近左端 · 4 中间位置 · 7 靠近右端。两端没有预设的好坏。
        </p>
        <div
          className="matrix-scroll"
          role="region"
          aria-label="原始评分矩阵，可横向滚动"
          tabIndex={0}
        >
          <table>
            <caption className="sr-only">各人物在每组构念上的原始评分</caption>
            <thead>
              <tr>
                <th scope="col">构念两极</th>
                {data.elements.map((e) => (
                  <th scope="col" key={e.id}>
                    {e.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.constructs.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    {c.leftPole}
                    <span className="muted"> ↔ </span>
                    {c.rightPole}
                  </th>
                  {data.elements.map((e) => {
                    const v = data.ratings[c.id]?.[e.id];
                    return (
                      <td
                        key={e.id}
                        className={isScore(v) ? "heat heat-" + v : ""}
                      >
                        {v === undefined
                          ? "未评分"
                          : v === "unknown"
                            ? "不了解"
                            : v === "skip"
                              ? "暂不评分"
                              : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <span className="section-index">04</span>
          <h2>把理解带回生活</h2>
          <span className="pill">可选 · CBT 辅助记录</span>
        </div>
        <p>
          从一个你愿意尝试、负担较小的行动开始。它是一次验证想法的机会，不是必须完成的任务。
        </p>
        <div className="action-grid">
          {Object.entries({
            situation: ["具体情境", "哪次相处让你想进一步理解自己？"],
            prediction: [
              "我的理解与预测",
              "如果我采取不同做法，我预期会发生什么？",
            ],
            emotion: ["情绪和应对", "当时有什么感受？我通常会怎样做？"],
            value: ["想保留的价值", "尝试改变时，我仍然希望珍惜什么？"],
            experiment: [
              "愿意尝试的小行动",
              "何时、何地、做什么？我会观察什么？",
            ],
            review: ["实际结果与复盘", "发生了什么？与预期有什么不同？"],
          }).map(([key, [title, placeholder]]) => (
            <label key={key}>
              {title}
              <textarea
                rows={3}
                maxLength={10000}
                placeholder={placeholder}
                value={data.action[key]}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    action: { ...d.action, [key]: e.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </section>
      <details className="panel">
        <summary>
          <BookOpen size={18} /> 方法、参数与计算说明
        </summary>
        <div className="settings-grid field">
          <label>
            一致构念最大差值
            <select
              value={data.settings.congruent}
              onChange={(e) => setting("congruent", +e.target.value)}
            >
              {[0, 1, 2].map((v) => (
                <option
                  value={v}
                  key={v}
                  disabled={v >= data.settings.discrepant}
                >
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            差异构念最小差值
            <select
              value={data.settings.discrepant}
              onChange={(e) => setting("discrepant", +e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6].map((v) => (
                <option
                  value={v}
                  key={v}
                  disabled={v <= data.settings.congruent}
                >
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            相关绝对值阈值
            <select
              value={data.settings.correlation}
              onChange={(e) => setting("correlation", +e.target.value)}
            >
              {Array.from(new Set([0.35, 0.5, 0.7, data.settings.correlation]))
                .sort()
                .map((v) => (
                  <option value={v} key={v}>
                    {v}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={data.settings.excludeSelf}
            onChange={(e) => setting("excludeSelf", e.target.checked)}
          />
          相关计算排除现实自我与理想自我
        </label>
        <p className="small">
          调整评分或参数会清除旧的线索反馈，请重新核对。本版默认沿用原项目差值
          ≤1、≥3 与
          |r|≥0.35，作为明确可调的探索规则，不宣称统一临床标准。不同方法与量尺可以采用其他规则。
        </p>
        <p className="small">
          理想评分为 4
          时不推断偏好方向；自我评分缺失或差值在两个阈值之间时不做两类归属。符合一致条件也不自动等于“核心价值”。当前一致{" "}
          {a.consistentConstructs.length} 组、差异{" "}
          {a.differenceConstructs.length} 组、未分类 {a.undifferentiated.length}{" "}
          组。缺失按有效配对排除；相关不足 3 对或零方差时不计算。
        </p>
        <p className="small">
          方法版本 MindGrid
          2.0。蕴含方向按差异构念改变方向、一致构念偏好方向和相关符号联合判断。
        </p>
        <a
          href="https://docs.openrepgrid.org/reference/indexDilemma.html"
          target="_blank"
          rel="noreferrer"
        >
          阅读 OpenRepGrid 方法说明
        </a>
      </details>
      <details className="panel">
        <summary>
          <Clipboard size={18} /> 准备给 AI 的讨论材料（可选）
        </summary>
        <p>
          此处只生成可复制的文字，不会自动发送。复制前请检查自由文本中的身份信息。代号替换不等于完全匿名。
        </p>
        <label className="check-label">
          <input
            type="checkbox"
            checked={pseudo}
            onChange={(e) => setPseudo(e.target.checked)}
          />
          将人物名称替换成代号
        </label>
        <label className="field">
          预览材料（不含咨询师私人笔记）
          <textarea rows={10} readOnly value={prompt} />
        </label>
        <button
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(prompt);
              setMessage("讨论材料已复制，请自行决定是否发送给外部 AI。");
            } catch {
              setMessage("无法访问剪贴板，请在预览框内手动选择并复制。");
            }
          }}
        >
          <Clipboard size={17} />
          复制已预览的材料
        </button>
      </details>
      <div className="step-footer">
        <button className="secondary" onClick={onPrev}>
          <ArrowLeft size={18} />
          返回评分
        </button>
        <span className="small muted">可以保存下来，下次继续对话。</span>
      </div>
    </div>
  );
}
