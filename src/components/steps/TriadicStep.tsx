import React, { useState, useEffect } from "react";
import { useSession } from "@/src/SessionContext";
import { Card, CardContent } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { ArrowLeft, ArrowRight, RefreshCw, Plus, Check } from "lucide-react";
import { Element } from "@/src/types";

export default function TriadicStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { data, addConstruct, removeConstruct } = useSession();
  const [triad, setTriad] = useState<Element[]>([]);
  const [leftPole, setLeftPole] = useState("");
  const [rightPole, setRightPole] = useState("");
  const [justAdded, setJustAdded] = useState(false);
  const [selectedPair, setSelectedPair] = useState<string[]>([]);

  // Pick 3 random unique elements
  const drawTriad = () => {
    if (data.elements.length < 3) return;
    const shuffled = [...data.elements].sort(() => 0.5 - Math.random());
    setTriad(shuffled.slice(0, 3));
    setLeftPole("");
    setRightPole("");
    setJustAdded(false);
    setSelectedPair([]);
  };

  useEffect(() => {
    if (triad.length === 0) drawTriad();
  }, [data.elements]);

  const handleAdd = () => {
    if (leftPole.trim() && rightPole.trim() && selectedPair.length === 2) {
      addConstruct(leftPole.trim(), rightPole.trim());
      setJustAdded(true);
      setTimeout(() => {
        drawTriad();
      }, 1000);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedPair.includes(id)) {
      setSelectedPair(selectedPair.filter(x => x !== id));
    } else {
      if (selectedPair.length < 2) {
        setSelectedPair([...selectedPair, id]);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">三元对比例举 (Triadic Elicitation)</h2>
          <p className="text-slate-500">通过随机比较，帮助你发现内心深处评价他人的隐含"标尺"。</p>
        </div>
        <div className="text-sm text-slate-500 font-medium bg-white px-3 py-1 rounded-full border border-slate-200">
          已提取构念: <span className="text-emerald-600 font-bold">{data.constructs.length}</span> (建议 8-15 个)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
            {justAdded && (
              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in duration-300">
                 <div className="bg-white rounded-full p-3 shadow-lg text-emerald-600 flex items-center font-medium">
                   <Check className="w-5 h-5 mr-2" />
                   成功提取一组构念！正在抽取下一组...
                 </div>
              </div>
            )}
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <p className="text-slate-600 font-medium text-lg">
                  请观察以下三个元素，请先点击<strong className="text-indigo-600">选择其中两个有共同点的元素</strong>：
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mb-10">
                {triad.map((el, i) => {
                  const isSimilar = selectedPair.includes(el.id);
                  const isDifferent = selectedPair.length === 2 && !isSimilar;
                  
                  return (
                    <button 
                      key={el.id} 
                      onClick={() => handleToggleSelect(el.id)}
                      className={`flex-1 w-full flex flex-col items-center justify-center p-6 border-2 rounded-xl text-center transition-all focus:outline-none cursor-pointer duration-300
                        ${isSimilar ? "border-indigo-500 bg-indigo-50 shadow-md transform scale-105" : 
                          isDifferent ? "border-rose-400 bg-rose-50 shadow-md scale-95 opacity-80" : 
                          "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"}
                      `}
                    >
                      <span className={`font-semibold text-lg transition-colors ${isSimilar ? "text-indigo-800" : isDifferent ? "text-rose-800" : "text-slate-800"}`}>
                        {el.name}
                      </span>
                      {isSimilar && <span className="text-xs font-medium text-indigo-600 mt-2 bg-indigo-100 px-2 py-0.5 rounded-full animate-in zoom-in">相似项</span>}
                      {isDifferent && <span className="text-xs font-medium text-rose-600 mt-2 bg-rose-100 px-2 py-0.5 rounded-full animate-in zoom-in">不同项</span>}
                      {!isSimilar && !isDifferent && <span className="text-xs font-medium text-slate-400 mt-2">点击选择</span>}
                    </button>
                  );
                })}
              </div>

              <div className={`space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-100 transition-all duration-500 ${selectedPair.length === 2 ? "opacity-100 transform translate-y-0" : "opacity-30 pointer-events-none transform translate-y-4"}`}>
                {data.mode === 'guided' && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                    <strong className="block mb-1">💡 引导提示：</strong>
                    卡壳了吗？试着从这些维度思考他们：<br/>
                    • 性格：外向/内向，温和/暴躁<br/>
                    • 价值观：追求安稳/喜欢冒险，利他/利己<br/>
                    • 情感关系：亲密/疏离，依赖/独立
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs mr-2">1</span>
                    哪两个元素有相似之处？它们的相似特征是（显极）：
                  </label>
                  <Input 
                    value={leftPole}
                    onChange={e => setLeftPole(e.target.value)}
                    placeholder="例如：有责任心 / 情感疏离 / 追求成就..." 
                    className="border-indigo-200 focus-visible:ring-indigo-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs mr-2">2</span>
                    第三个元素与它们有何不同？其相反特征是（隐极）：
                  </label>
                  <Input 
                    value={rightPole}
                    onChange={e => setRightPole(e.target.value)}
                    placeholder="例如：逃避责任 / 温暖亲密 / 安于现状..." 
                    className="border-rose-200 focus-visible:ring-rose-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={drawTriad}
                    className="flex-1 border-slate-300 text-slate-600 hover:bg-slate-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> 换一组元素
                  </Button>
                  <Button 
                    onClick={handleAdd}
                    disabled={!leftPole.trim() || !rightPole.trim() || justAdded}
                    className="flex-1 bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-2" /> 确认此构念
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
           <Card className="border-slate-200 shadow-sm h-full max-h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-medium text-slate-800">已提取的构念清单</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {data.constructs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  暂无构念。在左侧提取后将显示在此处。
                </div>
              ) : (
                data.constructs.map((c, i) => (
                  <div key={c.id} className="text-sm p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-slate-400">构念 #{i + 1}</span>
                      <button 
                        onClick={() => removeConstruct(c.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        删除
                      </button>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                      <span className="text-indigo-700 font-medium truncate w-[45%] text-right">{c.leftPole}</span>
                      <span className="text-slate-300 text-xs px-2">VS</span>
                      <span className="text-rose-700 font-medium truncate w-[45%] text-left">{c.rightPole}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
           </Card>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200 mt-8">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 上一步
        </Button>
        <Button 
          onClick={onNext} 
          disabled={data.constructs.length < 3}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          下一步：网格评分 <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      {data.constructs.length < 3 && (
        <p className="text-sm text-center text-amber-600">你需要提取至少 3 组构念才能生成有意义的分析报告哦。（建议提取 8 组以上）</p>
      )}
    </div>
  );
}
