import React, { useState } from "react";
import { SessionProvider } from "./SessionContext";
import IntroStep from "./components/steps/IntroStep";
import ElementStep from "./components/steps/ElementStep";
import TriadicStep from "./components/steps/TriadicStep";
import RatingStep from "./components/steps/RatingStep";
import AnalysisStep from "./components/steps/AnalysisStep";

function WizardManager() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => setCurrentStep((s) => s + 1);
  const prevStep = () => setCurrentStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-medium tracking-tight text-slate-900">
          个人构念心理评估 (Personal Construct Assessment)
        </h1>
        <div className="flex space-x-2 text-sm text-slate-500">
          {[
            "主题设定",
            "确立元素",
            "提取构念",
            "矩阵评分",
            "分析报告",
          ].map((label, i) => (
            <div key={i} className="flex items-center">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${currentStep === i ? "border-slate-800 bg-slate-800 text-white" : currentStep > i ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400"} text-xs font-semibold mr-2 transition-colors`}
              >
                {i + 1}
              </span>
              <span className={`hidden sm:inline ${currentStep === i ? "font-medium text-slate-900" : ""} ${currentStep > i ? "text-emerald-600" : ""}`}>
                {label}
              </span>
              {i < 4 && <div className="w-4 border-t border-slate-300 mx-2" />}
            </div>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-4 sm:p-8">
        {currentStep === 0 && <IntroStep onNext={nextStep} />}
        {currentStep === 1 && <ElementStep onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 2 && <TriadicStep onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 3 && <RatingStep onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 4 && <AnalysisStep onPrev={prevStep} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <WizardManager />
    </SessionProvider>
  );
}
