import type { SessionData } from "../types";
import { DEFAULT_SETTINGS, generateId, isScore, localDateStamp } from "./utils";
export const STORAGE_KEY = "mindgrid-session-v2";
export function freshSession(): SessionData {
  return {
    version: 2,
    id: generateId(),
    updatedAt: new Date().toISOString(),
    step: 0,
    theme: "",
    mode: "guided",
    scenario: "personal",
    clientCode: "",
    elements: [
      { id: "e_real_self", name: "现实自我", role: "self", isCustom: false },
      { id: "e_ideal_self", name: "理想自我", role: "ideal", isCustom: false },
    ],
    constructs: [],
    ratings: {},
    notes: "",
    feedback: {},
    reflection: "",
    action: {
      situation: "",
      prediction: "",
      emotion: "",
      value: "",
      experiment: "",
      review: "",
    },
    settings: { ...DEFAULT_SETTINGS },
  };
}
export function parseSession(raw: string): SessionData {
  if (raw.length > 2_000_000)
    throw new Error("文件过大，请选择本工具导出的会话文件。");
  const x = JSON.parse(raw);
  const str = (v: unknown, max = 10000) =>
    typeof v === "string" && v.length <= max;
  const obj = (v: any) =>
    v !== null && typeof v === "object" && !Array.isArray(v);
  const id = (v: unknown) =>
    str(v, 100) &&
    /^[a-zA-Z0-9_-]+$/.test(v as string) &&
    !["__proto__", "constructor", "prototype"].includes(v as string);
  if (
    !obj(x) ||
    x.version !== 2 ||
    !id(x.id) ||
    !str(x.updatedAt, 100) ||
    !Number.isFinite(Date.parse(x.updatedAt)) ||
    !str(x.theme, 200) ||
    !str(x.clientCode, 100) ||
    !str(x.notes) ||
    !str(x.reflection) ||
    !["personal", "consultation"].includes(x.scenario) ||
    !["guided", "concise"].includes(x.mode) ||
    !Number.isInteger(x.step) ||
    x.step < 0 ||
    x.step > 4
  )
    throw new Error("会话格式不正确或版本不受支持。");
  if (
    !Array.isArray(x.elements) ||
    x.elements.length < 2 ||
    x.elements.length > 40 ||
    !x.elements.every(
      (e) =>
        obj(e) &&
        id(e.id) &&
        str(e.name, 100) &&
        e.name.trim() &&
        ["self", "ideal", "other"].includes(e.role),
    ) ||
    new Set(x.elements.map((e) => e.id)).size !== x.elements.length ||
    ["self", "ideal"].some(
      (role) => x.elements.filter((e) => e.role === role).length !== 1,
    )
  )
    throw new Error("人物列表不完整或有重复标识。");
  if (
    !Array.isArray(x.constructs) ||
    x.constructs.length > 40 ||
    !x.constructs.every(
      (c) =>
        obj(c) &&
        id(c.id) &&
        str(c.leftPole, 100) &&
        c.leftPole.trim() &&
        str(c.rightPole, 100) &&
        c.rightPole.trim() &&
        c.leftPole !== c.rightPole &&
        (c.example === undefined || str(c.example, 2000)),
    ) ||
    new Set(x.constructs.map((c) => c.id)).size !== x.constructs.length
  )
    throw new Error("构念数据不正确。");
  if (
    !obj(x.ratings) ||
    !Object.entries(x.ratings).every(
      ([cid, row]) =>
        x.constructs.some((c) => c.id === cid) &&
        obj(row) &&
        Object.entries(row).every(
          ([eid, v]) =>
            x.elements.some((e) => e.id === eid) &&
            (isScore(v) || v === "unknown" || v === "skip"),
        ),
    )
  )
    throw new Error("评分必须是 1–7、不了解或暂不评分。");
  if (
    !obj(x.feedback) ||
    !Object.entries(x.feedback).every(
      ([k, v]) =>
        k.length < 250 &&
        ["符合我的体验", "部分符合", "不符合", "暂不确定"].includes(
          v as string,
        ),
    ) ||
    !obj(x.action) ||
    [
      "situation",
      "prediction",
      "emotion",
      "value",
      "experiment",
      "review",
    ].some((k) => !str(x.action[k]))
  )
    throw new Error("反思记录格式不正确。");
  const s = x.settings;
  if (
    !obj(s) ||
    !Number.isInteger(s.congruent) ||
    s.congruent < 0 ||
    s.congruent > 2 ||
    !Number.isInteger(s.discrepant) ||
    s.discrepant <= s.congruent ||
    s.discrepant > 6 ||
    typeof s.correlation !== "number" ||
    s.correlation < 0.1 ||
    s.correlation > 1 ||
    typeof s.excludeSelf !== "boolean"
  )
    throw new Error("分析参数不正确。");
  const d: SessionData = { ...freshSession(), ...x };
  if (
    x.seenTriads !== undefined &&
    (!Array.isArray(x.seenTriads) ||
      x.seenTriads.length > 10000 ||
      !x.seenTriads.every((v) => str(v, 350)))
  )
    throw new Error("比较记录格式不正确。");
  if (x.triadDraft !== undefined) {
    const t = x.triadDraft;
    if (
      !obj(t) ||
      !Array.isArray(t.ids) ||
      t.ids.length !== 3 ||
      new Set(t.ids).size !== 3 ||
      !t.ids.every(id) ||
      !Array.isArray(t.pair) ||
      t.pair.length > 2 ||
      !t.pair.every((v) => t.ids.includes(v)) ||
      !str(t.left, 100) ||
      !str(t.right, 100) ||
      !str(t.example, 2000) ||
      !(t.editing === null || id(t.editing))
    )
      throw new Error("构念草稿格式不正确。");
    if (
      !t.ids.every((eid) => d.elements.some((e) => e.id === eid)) ||
      (t.editing && !d.constructs.some((c) => c.id === t.editing))
    )
      delete d.triadDraft;
  }
  if (d.elements.length < 3) d.step = Math.min(d.step, 1);
  if (!d.constructs.length) d.step = Math.min(d.step, 2);
  return d;
}
export function downloadJSON(data: SessionData) {
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = "mindgrid-" + localDateStamp() + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
