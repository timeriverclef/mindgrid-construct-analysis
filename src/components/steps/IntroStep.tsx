import { ArrowRight, UserRound, UsersRound, Leaf, FlaskConical } from "lucide-react";
import { useSession } from "../../SessionContext";
export default function IntroStep({ onNext, onDemo }: { onNext: () => void; onDemo?: () => void }) {
  const { data, update } = useSession();
  return (
    <div className="stack">
      <div className="intro-heading">
        <div className="eyebrow">从一个具体的问题开始</div>
        <h1>
          换个角度，
          <br />
          看见自己的<span className="accent">内在标尺。</span>
        </h1>
        <p className="lead">
          我们如何理解自己，也如何理解他人？
          <br className="desktop-only" />
          从熟悉的人物出发，发现那些对你重要的区别。
        </p>
      </div>
      {onDemo && <section className="demo-card" aria-labelledby="demo-card-title">
        <div className="demo-icon"><FlaskConical size={23} aria-hidden="true" /></div>
        <div>
          <div className="eyebrow">第一次打开？</div>
          <h2 id="demo-card-title">先看看一份做完的心格</h2>
          <p className="small">用虚构的职场例子看看评分和探索线索，不会动到你的记录。</p>
        </div>
        <button className="secondary" onClick={onDemo}>试用案例 <ArrowRight size={17} /></button>
      </section>}
      <section className="panel">
        <div className="section-heading">
          <span className="section-index">01</span>
          <h2>今天，你想怎样探索？</h2>
        </div>
        <div className="mode-grid">
          {(
            [
              {
                id: "personal",
                title: "个人探索",
                text: "留一点时间，听见自己的理解。",
                icon: UserRound,
              },
              {
                id: "consultation",
                title: "咨询协作",
                text: "与咨询师一起澄清、记录和讨论。",
                icon: UsersRound,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={
                "mode-card " + (data.scenario === item.id ? "selected" : "")
              }
              aria-pressed={data.scenario === item.id}
              onClick={() => update((d) => ({ ...d, scenario: item.id }))}
            >
              <item.icon size={24} />
              <strong>{item.title}</strong>
              <span>{item.text}</span>
              <span className="selection-dot" aria-hidden="true" />
            </button>
          ))}
        </div>
        {data.scenario === "consultation" && (
          <label className="field">
            来访者代号（可选，不填写真实姓名）
            <input
              maxLength={100}
              value={data.clientCode}
              onChange={(e) =>
                update((d) => ({ ...d, clientCode: e.target.value }))
              }
              placeholder="例如：访谈 A"
            />
          </label>
        )}
        <label className="field">
          本次想理解的主题
          <input
            autoComplete="off"
            maxLength={200}
            value={data.theme}
            onChange={(e) => update((d) => ({ ...d, theme: e.target.value }))}
            placeholder="例如：为什么我很难在工作中表达不同意见？"
          />
        </label>
        <div className="chips" aria-label="主题示例">
          {["工作中的自我表达", "亲密关系里的我", "面对改变时的犹豫"].map(
            (t) => (
              <button
                className="chip"
                key={t}
                onClick={() => update((d) => ({ ...d, theme: t }))}
              >
                {t}
              </button>
            ),
          )}
        </div>
        <label className="check-label field">
          <input
            type="checkbox"
            checked={data.mode === "guided"}
            onChange={(e) =>
              update((d) => ({
                ...d,
                mode: e.target.checked ? "guided" : "concise",
              }))
            }
          />
          显示分步引导（提示可随时展开）
        </label>
        <div className="panel-bottom">
          <span className="small muted">可分段完成，随时返回修改。</span>
          <button
            className="primary"
            disabled={!data.theme.trim()}
            onClick={onNext}
          >
            开始探索 <ArrowRight size={18} />
          </button>
        </div>
      </section>
      <div className="gentle-note">
        <Leaf size={22} />
        <div>
          <strong>理解先于判断</strong>
          <p>
            构念是你描述经验的方式，不是人格标签。结果是一份对话邀请，是否贴近你的生活，由你来判断。
          </p>
        </div>
      </div>
      <details className="method-details">
        <summary>了解方法与数据保存</summary>
        <p>
          构念网格法（Repertory
          Grid）源于乔治·凯利的个人构念心理学。本工具通过人物比较提取两极构念，再以
          1–7 分记录你的理解。三元比较只是提取方式之一，不是测谎或潜意识诊断。
        </p>
        <p>
          评分在浏览器中计算。未开启本地保存时，关闭或刷新页面可能丢失进度。导出的文件包含你选择保留的内容，请自行妥善保管。
        </p>
      </details>
    </div>
  );
}
