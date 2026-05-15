import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Ratings, Construct, Element, IDilemma } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Calculate mean of an array
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Calculate Pearson correlation coefficient
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const mX = mean(x);
  const mY = mean(y);
  
  let num = 0;
  let denX = 0;
  let denY = 0;
  
  for (let i = 0; i < x.length; i++) {
    const diffX = x[i] - mX;
    const diffY = y[i] - mY;
    
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  
  if (denX === 0 || denY === 0) return 0;
  
  return num / Math.sqrt(denX * denY);
}

// Main Analysis Logic
export function analyzeGrid(elements: Element[], constructs: Construct[], ratings: Ratings) {
  const realSelfId = elements.find((e) => e.name === "现实自我" || e.name === "Real Self")?.id;
  const idealSelfId = elements.find((e) => e.name === "理想自我" || e.name === "Ideal Self")?.id;

  if (!realSelfId || !idealSelfId) {
    return { differenceConstructs: [], consistentConstructs: [], dilemmas: [] };
  }

  const differenceConstructs: string[] = [];
  const consistentConstructs: string[] = [];

  constructs.forEach((c) => {
    const realScore = ratings[c.id]?.[realSelfId];
    const idealScore = ratings[c.id]?.[idealSelfId];
    
    if (realScore !== undefined && idealScore !== undefined) {
      const diff = Math.abs(realScore - idealScore);
      // "差异构念" (Difference Construct)代表渴望改变的领域
      if (diff >= 3) {
        differenceConstructs.push(c.id);
      } 
      // "一致构念" (Consistent Construct)代表满意的价值观
      else if (diff <= 1) {
        consistentConstructs.push(c.id);
      }
    }
  });

  let extremeCount = 0;
  let totalRatings = 0;
  const realScores: number[] = [];
  const idealScores: number[] = [];

  constructs.forEach((c) => {
    const rs = ratings[c.id]?.[realSelfId] || 4;
    const is = ratings[c.id]?.[idealSelfId] || 4;
    realScores.push(rs);
    idealScores.push(is);

    elements.forEach((e) => {
      const score = ratings[c.id]?.[e.id];
      if (score !== undefined) {
        totalRatings++;
        if (score === 1 || score === 7) extremeCount++;
      }
    });
  });

  const polarizationRatio = totalRatings > 0 ? extremeCount / totalRatings : 0;
  const selfEsteemCorrelation = pearsonCorrelation(realScores, idealScores);

  let totalSocialDistance = 0;
  let socialComparisons = 0;
  elements.forEach((e) => {
    if (e.id !== realSelfId && e.id !== idealSelfId) {
      let distSum = 0;
      constructs.forEach((c) => {
        const rs = ratings[c.id]?.[realSelfId] || 4;
        const es = ratings[c.id]?.[e.id] || 4;
        distSum += Math.abs(rs - es);
      });
      totalSocialDistance += distSum / constructs.length;
      socialComparisons++;
    }
  });
  const perceivedSocialDistance = socialComparisons > 0 ? totalSocialDistance / socialComparisons : 0;

  const dilemmas: IDilemma[] = [];
  
  // Elements vector keys for alignment
  const elementIds = elements.map(e => e.id);

  // 计算蕴含性困境 (Implicative Dilemmas)
  differenceConstructs.forEach((dcId) => {
    const ccPossible: {id: string, r: number}[] = [];
    consistentConstructs.forEach((ccId) => {
      const dcScores = elementIds.map((eid) => ratings[dcId]?.[eid] || 4);
      const ccScores = elementIds.map((eid) => ratings[ccId]?.[eid] || 4);
      
      const r = pearsonCorrelation(dcScores, ccScores);
      
      // Target direction for DC
      const dcIdeal = ratings[dcId]?.[idealSelfId] || 4;
      const dcReal = ratings[dcId]?.[realSelfId] || 4;
      
      const ccIdeal = ratings[ccId]?.[idealSelfId] || 4;
      const ccReal = ratings[ccId]?.[realSelfId] || 4;

      // Desired pole map (-1 = towards left pole, 1 = towards right pole)
      const dcPole = dcIdeal > dcReal ? 1 : -1;
      const ccPole = ccIdeal > 4 ? 1 : (ccIdeal < 4 ? -1 : 0); 

      // IF correlation goes such that moving towards DC ideal moves AWAY from CC ideal
      // r * dcPole * ccPole < 0 implies negative outcome.
      const threshold = 0.35; // typical clinical threshold
      
      if (Math.abs(r) >= threshold && ccPole !== 0) {
         if (r * dcPole * ccPole < 0) {
           dilemmas.push({
             differenceConstructId: dcId,
             consistentConstructId: ccId,
             correlation: r
           });
         }
      }
    });
  });

  return { 
    differenceConstructs, 
    consistentConstructs, 
    dilemmas,
    polarizationRatio,
    selfEsteemCorrelation,
    perceivedSocialDistance
  };
}
