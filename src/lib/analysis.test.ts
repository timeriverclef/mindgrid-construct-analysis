import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeGrid, pearsonCorrelation, DEFAULT_SETTINGS } from "./utils";
import { freshSession, parseSession } from "./session";
import { aiText, reportText } from "./report";
const elements = [
  { id: "s", name: "我", role: "self" },
  { id: "i", name: "理想", role: "ideal" },
  ...["a", "b", "c", "d"].map((id) => ({ id, name: id, role: "other" })),
] as any;
const constructs = [
  { id: "change", leftPole: "沉默", rightPole: "表达" },
  { id: "value", leftPole: "疏离", rightPole: "体贴" },
];
const row = (v: number[]) =>
  Object.fromEntries(elements.map((e, j) => [e.id, v[j]]));
const ratings = {
  change: row([1, 7, 1, 2, 6, 7]),
  value: row([7, 7, 7, 6, 2, 1]),
};
test("undefined correlations stay null, real zero stays zero", () => {
  assert.equal(pearsonCorrelation([4, 4, 4], [1, 2, 3]), null);
  assert.equal(pearsonCorrelation([1, 2], [2, 3]), null);
  assert.equal(pearsonCorrelation([], []), null);
  assert.equal(pearsonCorrelation([1, 2, 3], [1, 0, 1]), 0);
});
test("perfect pattern correlation does not imply small distance", () => {
  const cs = [1, 2, 3].map((i) => ({
    id: "c" + i,
    leftPole: "a",
    rightPole: "b",
  }));
  const rs = { c1: { s: 1, i: 4 }, c2: { s: 2, i: 5 }, c3: { s: 3, i: 6 } };
  const a = analyzeGrid(elements, cs, rs);
  assert.equal(a.selfEsteemCorrelation, 1);
  assert.equal(a.selfDistance, 3);
});
test("directional dilemma and valid pair count", () => {
  const a = analyzeGrid(elements, constructs, ratings, {
    ...DEFAULT_SETTINGS,
    excludeSelf: true,
  });
  assert.equal(a.dilemmas.length, 1);
  assert.equal(a.dilemmas[0].correlation, -1);
  assert.equal(a.dilemmas[0].n, 4);
});
test("reversing either construct preserves dilemma detection", () => {
  for (const cid of ["change", "value"]) {
    const r = {
      ...ratings,
      [cid]: Object.fromEntries(
        Object.entries(ratings[cid]).map(([k, v]) => [k, 8 - (v as number)]),
      ),
    };
    assert.equal(
      analyzeGrid(elements, constructs, r, {
        ...DEFAULT_SETTINGS,
        excludeSelf: true,
      }).dilemmas.length,
      1,
    );
  }
});
test("positive compatible association is not a dilemma", () => {
  assert.equal(
    analyzeGrid(
      elements,
      constructs,
      { ...ratings, value: row([7, 7, 1, 2, 6, 7]) },
      { ...DEFAULT_SETTINGS, excludeSelf: true },
    ).dilemmas.length,
    0,
  );
});
test("ideal midpoint is not assigned a preferred pole", () => {
  const a = analyzeGrid(elements, constructs, {
    ...ratings,
    change: { ...ratings.change, i: 4 },
  });
  assert.equal(a.differenceConstructs.length, 0);
  assert.ok(a.undifferentiated.includes("change"));
});
test("missing, unknown and skipped scores are excluded, not imputed", () => {
  const r: any = {
    change: { s: 1, i: 7, a: 1, b: "unknown", c: 6, d: "skip" },
    value: ratings.value,
  };
  const a = analyzeGrid(elements, constructs, r, {
    ...DEFAULT_SETTINGS,
    excludeSelf: true,
  });
  assert.equal(a.valid, 10);
  assert.equal(a.dilemmas.length, 0);
  assert.equal(a.unavailablePairs, 1);
});
test("empty grid metrics unavailable, never NaN or false zero", () => {
  const a = analyzeGrid(elements, [], {});
  assert.equal(a.selfDistance, null);
  assert.equal(a.polarizationRatio, null);
  assert.equal(a.perceivedSocialDistance, null);
  assert.equal(a.selfEsteemCorrelation, null);
});
test("names are not used to identify self elements", () => {
  const a = analyzeGrid(
    elements.map((e) => ({ ...e, name: "匿名" })),
    constructs,
    ratings,
  );
  assert.deepEqual(a.differenceConstructs, ["change"]);
});
test("threshold boundaries apply inclusively", () => {
  const cs = [
    { id: "c", leftPole: "a", rightPole: "b" },
    { id: "v", leftPole: "a", rightPole: "b" },
  ];
  const a = analyzeGrid(elements, cs, { c: { s: 2, i: 5 }, v: { s: 6, i: 7 } });
  assert.deepEqual(a.differenceConstructs, ["c"]);
  assert.deepEqual(a.consistentConstructs, ["v"]);
});
test("session roundtrip and restore step", () => {
  const d = freshSession();
  assert.deepEqual(parseSession(JSON.stringify(d)), d);
  d.step = 4;
  assert.equal(parseSession(JSON.stringify(d)).step, 1);
});
test("invalid scores, duplicate ids, unsafe keys and bad settings rejected", () => {
  const d = freshSession();
  d.constructs = [{ id: "c", leftPole: "a", rightPole: "b" }];
  for (const v of [0, 8, 4.5, null, "4"])
    assert.throws(() =>
      parseSession(
        JSON.stringify({ ...d, ratings: { c: { e_real_self: v } } }),
      ),
    );
  assert.throws(() =>
    parseSession(
      JSON.stringify({ ...d, elements: [...d.elements, d.elements[0]] }),
    ),
  );
  assert.throws(() =>
    parseSession(
      JSON.stringify({
        ...d,
        settings: { ...d.settings, congruent: 2, discrepant: 1 },
      }),
    ),
  );
  assert.throws(() => parseSession(JSON.stringify({ ...d, id: "__proto__" })));
});
test("private notes excluded by default and AI export always excludes them", () => {
  const d = freshSession();
  d.theme = "示例";
  d.notes = "PRIVATE-NOTE";
  d.clientCode = "CLIENT-CODE";
  assert.ok(!reportText(d).includes("PRIVATE-NOTE"));
  assert.ok(reportText(d, true).includes("PRIVATE-NOTE"));
  assert.ok(!aiText(d, true).includes("PRIVATE-NOTE"));
  assert.ok(!aiText(d, true).includes("CLIENT-CODE"));
});
test("pseudonym replacement applies to names and repeated names in free text", () => {
  const d = freshSession();
  d.elements.push({ id: "other", name: "测试人物甲", role: "other" });
  d.reflection = "测试人物甲的表达";
  assert.ok(!aiText(d, true).includes("测试人物甲"));
  assert.ok(aiText(d, true).includes("人物 3"));
});
