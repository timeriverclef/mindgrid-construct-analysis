import React, { createContext, useContext, useState, ReactNode } from "react";
import { SessionData, Element, Construct, Ratings } from "./types";
import { generateId } from "./lib/utils";

interface SessionContextType {
  data: SessionData;
  setTheme: (theme: string) => void;
  setMode: (mode: "concise" | "guided") => void;
  addElement: (name: string, isCustom?: boolean) => void;
  removeElement: (id: string) => void;
  addConstruct: (left: string, right: string) => void;
  removeConstruct: (id: string) => void;
  setRating: (constructId: string, elementId: string, score: number) => void;
  resetSession: () => void;
}

const defaultElements: Element[] = [
  { id: "e_real_self", name: "现实自我", isCustom: false },
  { id: "e_ideal_self", name: "理想自我", isCustom: false },
];

const defaultData: SessionData = {
  theme: "",
  mode: "concise",
  elements: [...defaultElements],
  constructs: [],
  ratings: {},
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SessionData>(defaultData);

  const setTheme = (theme: string) => setData((d) => ({ ...d, theme }));
  const setMode = (mode: "concise" | "guided") => setData((d) => ({ ...d, mode }));

  const addElement = (name: string, isCustom = true) => {
    setData((d) => {
      // Prevent duplicates by name
      if (d.elements.find(e => e.name === name)) return d;
      const newEl = { id: generateId(), name, isCustom };
      return { ...d, elements: [...d.elements, newEl] };
    });
  };

  const removeElement = (id: string) => {
    setData((d) => ({
      ...d,
      elements: d.elements.filter((e) => e.id !== id || e.isCustom === false),
    }));
  };

  const addConstruct = (left: string, right: string) => {
    setData((d) => ({
      ...d,
      constructs: [...d.constructs, { id: generateId(), leftPole: left, rightPole: right }],
    }));
  };

  const removeConstruct = (id: string) => {
    setData((d) => {
      const newRatings = { ...d.ratings };
      delete newRatings[id];
      return {
        ...d,
        constructs: d.constructs.filter((c) => c.id !== id),
        ratings: newRatings
      };
    });
  };

  const setRating = (constructId: string, elementId: string, score: number) => {
    setData((d) => ({
      ...d,
      ratings: {
        ...d.ratings,
        [constructId]: {
          ...(d.ratings[constructId] || {}),
          [elementId]: score,
        },
      },
    }));
  };

  const resetSession = () => setData(defaultData);

  return (
    <SessionContext.Provider
      value={{
        data,
        setTheme,
        setMode,
        addElement,
        removeElement,
        addConstruct,
        removeConstruct,
        setRating,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}
