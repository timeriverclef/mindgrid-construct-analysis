export interface Element {
  id: string;
  name: string;
  isCustom?: boolean;
}

export interface Construct {
  id: string;
  leftPole: string; // 显极 - typical/emergent pole
  rightPole: string; // 隐极 - implicit pole
}

export interface Ratings {
  // constructId -> elementId -> score (1-7)
  [constructId: string]: {
    [elementId: string]: number;
  };
}

export interface SessionData {
  theme: string;
  mode: "concise" | "guided";
  elements: Element[];
  constructs: Construct[];
  ratings: Ratings;
}

export interface IDilemma {
  differenceConstructId: string;
  consistentConstructId: string;
  correlation: number;
}
