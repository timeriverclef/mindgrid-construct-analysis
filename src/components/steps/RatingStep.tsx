import React, { useState } from "react";
import { useSession } from "@/src/SessionContext";
import { Card, CardContent } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function RatingStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { data, setRating } = useSession();
  const [activeElIdx, setActiveElIdx] = useState(0);

  const elements = data.elements;
  const constructs = data.constructs;
  const activeElement = elements[activeElIdx];

  const handleNextElement = () => {
    setActiveElIdx(Math.min(elements.length - 1, activeElIdx + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevElement = () => {
    setActiveElIdx(Math.max(0, activeElIdx - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Check if current element is fully rated
  const isElementFullyRated = (elementId: string) => {
    return constructs.every(c => data.ratings[c.id]?.[elementId] !== undefined);
  };

  // Check if entire grid is rated
  const isGridComplete = elements.every(e => isElementFullyRated(e.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">网格矩阵评分 (Grid Rating)</h2>
          <p className="text-slate-500">
            请基于 1 到 7 分对每一个元素进行评价。1分代表极致符合左侧词，7分代表极致符合右侧词。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="font-medium text-slate-800 mb-4 px-2">评估对象</h3>
          {elements.map((el, i) => {
            const isComplete = isElementFullyRated(el.id);
            const isActive = i === activeElIdx;
            
            return (
              <button
                key={el.id}
                onClick={() => setActiveElIdx(i)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between
                  ${isActive ? "bg-slate-900 text-white shadow-md" : "bg-white border hover:bg-slate-50 text-slate-700"}
                  ${isComplete && !isActive ? "border-emerald-200" : "border-slate-200"}
                `}
              >
                <span>{el.name}</span>
                {isComplete && <CheckCircle2 className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-emerald-500"}`} />}
              </button>
            );
          })}
        </div>

        {/* Rating Area */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200 shadow-sm bg-white pt-6">
            <CardContent className="space-y-8">
              <div className="border-b border-slate-100 pb-4 text-center">
                <span className="text-sm text-slate-500 mb-1 block">当前评估对象</span>
                <h3 className="text-2xl font-bold text-slate-900">{activeElement.name}</h3>
              </div>

              <div className="space-y-10">
                {constructs.map((c, i) => {
                  const currentValue = data.ratings[c.id]?.[activeElement.id];
                  
                  return (
                    <div key={c.id} className="space-y-4">
                       <div className="flex justify-between text-sm font-medium px-2">
                          <span className="text-indigo-700 w-1/3 text-left line-clamp-2">{c.leftPole}</span>
                          <span className="text-slate-400 w-1/3 text-center">
                            {currentValue ? `已选: ${currentValue}` : '未评分'}
                          </span>
                          <span className="text-rose-700 w-1/3 text-right line-clamp-2">{c.rightPole}</span>
                       </div>
                       
                       <div className="relative pt-4 pb-2">
                         <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-full relative">
                           {/* Track background line */}
                           <div className="absolute left-0 right-0 h-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-200 via-slate-200 to-rose-200 rounded-full mx-4 pointer-events-none"></div>
                           
                           {[1, 2, 3, 4, 5, 6, 7].map(score => {
                             const isSelected = currentValue === score;
                             let colorClass = "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50";
                             
                             if (isSelected) {
                               switch (score) {
                                 case 1: colorClass = "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200 scale-110"; break;
                                 case 2: colorClass = "bg-indigo-500 text-white border-indigo-600 shadow-sm shadow-indigo-100 scale-110"; break;
                                 case 3: colorClass = "bg-indigo-400 text-white border-indigo-500 shadow-sm shadow-indigo-100 scale-110"; break;
                                 case 4: colorClass = "bg-slate-500 text-white border-slate-600 shadow-sm shadow-slate-200 scale-110"; break;
                                 case 5: colorClass = "bg-rose-400 text-white border-rose-500 shadow-sm shadow-rose-100 scale-110"; break;
                                 case 6: colorClass = "bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-100 scale-110"; break;
                                 case 7: colorClass = "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-200 scale-110"; break;
                               }
                             }

                             return (
                               <button
                                 key={score}
                                 onClick={() => setRating(c.id, activeElement.id, score)}
                                 className={`relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-200 my-0.5 mx-0.5 ${colorClass}`}
                               >
                                 {score}
                               </button>
                             );
                           })}
                         </div>
                       </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="pt-8 border-t border-slate-100 flex justify-between">
                <Button variant="outline" onClick={handlePrevElement} disabled={activeElIdx === 0}>
                  上一个对象
                </Button>
                {activeElIdx < elements.length - 1 ? (
                  <Button onClick={handleNextElement} className="bg-slate-800 hover:bg-slate-900 text-white">
                    下一个对象 <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button disabled={!isGridComplete} onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    完成评分并分析 <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200 mt-8">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 重新提取构念
        </Button>
        <span className="text-sm text-slate-500 flex items-center">
          {isGridComplete ? (
            <span className="text-emerald-600 font-medium flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> 所有项已评分</span>
          ) : "部分表格尚未评分，请检查侧边栏。您可以随意切换但必须全部填完才能分析。"}
        </span>
      </div>
    </div>
  );
}
