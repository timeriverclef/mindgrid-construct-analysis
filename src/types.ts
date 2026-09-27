export interface Element {
  id: string;
  name: string;
  role: "self" | "ideal" | "other";
  isCustom?: boolean;
}
export interface Construct {
  id: string;
  leftPole: string;
  rightPole: string;
  example?: string;
}
export type Rating = number | "unknown" | "skip";
export interface Ratings {
  [constructId: string]: { [elementId: string]: Rating };
}
export interface AnalysisSettings {
  congruent: number;
  discrepant: number;
  correlation: number;
  excludeSelf: boolean;
}
export interface SessionData {
  version: 2;
  id: string;
  updatedAt: string;
  step: number;
  theme: string;
  mode: "concise" | "guided";
  scenario: "personal" | "consultation";
  clientCode: string;
  elements: Element[];
  constructs: Construct[];
  ratings: Ratings;
  notes: string;
  feedback: Record<string, string>;
  reflection: string;
  seenTriads?: string[];
  triadDraft?: {
    ids: string[];
    pair: string[];
    left: string;
    right: string;
    example: string;
    editing: string | null;
  };
  action: {
    situation: string;
    prediction: string;
    emotion: string;
    value: string;
    experiment: string;
    review: string;
  };
  settings: AnalysisSettings;
}
export interface IDilemma {
  differenceConstructId: string;
  consistentConstructId: string;
  correlation: number;
  n: number;
}
