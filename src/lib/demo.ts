import { freshSession } from "./session";
import type { SessionData } from "../types";

export function demoSession(): SessionData {
  const session = freshSession();
  const people = ["林同事", "周同事", "许同学", "陈朋友"].map((name, i) => ({
    id: "demo_person_" + i, name, role: "other" as const, isCustom: true,
  }));
  const elements = [...session.elements, ...people];
  const constructs = [
    { id: "demo_speaking", leftPole: "犹豫不开口", rightPole: "直接表达", example: "开会时，能不能说出不同的意见？" },
    { id: "demo_listening", leftPole: "不太顾及他人", rightPole: "体谅他人", example: "意见不同时，是否仍会听完对方的理由？" },
  ];
  const scores = [[2, 6, 1, 7, 6, 5], [7, 7, 7, 1, 2, 3]];
  return {
    ...session,
    step: 4,
    theme: "虚构案例：表达不同意见时，我担心显得不体谅人",
    elements,
    constructs,
    ratings: Object.fromEntries(constructs.map((construct, row) => [
      construct.id, Object.fromEntries(elements.map((person, i) => [person.id, scores[row][i]])),
    ])),
  };
}
