import React, { useState } from "react";
import { useSession } from "@/src/SessionContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { ArrowLeft, ArrowRight, UserPlus, X, Info } from "lucide-react";

const SUGGESTED_ROLES = [
  "母亲 (或抚养者)",
  "父亲 (或抚养者)",
  "欣赏的人",
  "让你感到不舒服的人",
  "最好的朋友",
  "前任/曾经亲密的人",
  "同情或可怜的人",
  "让我感到害怕或受威胁的人",
  "权威人物/领导老师",
  "成功的同事/同学",
  "一直想成为的人",
  "问题出现前的我",
  "6个月后的我",
];

export default function ElementStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { data, addElement, removeElement } = useSession();
  const [newElement, setNewElement] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newElement.trim()) {
      addElement(newElement.trim());
      setNewElement("");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">建立元素池 (Elements)</h2>
          <p className="text-slate-500">这些元素将作为坐标系的基准点，请列举与“{data.theme}”相关的真实人物或状态。</p>
        </div>
        <div className="text-sm text-slate-500 font-medium bg-white px-3 py-1 rounded-full border border-slate-200">
          已添加: <span className="text-indigo-600 font-bold">{data.elements.length}</span> (建议 8-15 个)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                目前的元素清单
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {data.elements.map((el) => (
                  <div
                    key={el.id}
                    className={`flex items-center px-4 py-2 rounded-full border text-sm font-medium shadow-sm transition-all
                      ${el.isCustom === false 
                        ? 'bg-amber-50 border-amber-200 text-amber-800' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow'}`}
                  >
                    {el.name}
                    {el.isCustom !== false && (
                      <button
                        onClick={() => removeElement(el.id)}
                        className="ml-2 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
                        aria-label="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {el.isCustom === false && (
                      <span className="ml-2 text-xs opacity-60">(内置)</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleAdd} className="flex gap-3">
                <Input
                  value={newElement}
                  onChange={(e) => setNewElement(e.target.value)}
                  placeholder="输入新元素名称..."
                  className="flex-1"
                />
                <Button type="submit" variant="secondary" className="bg-slate-100 hover:bg-slate-200">
                  <UserPlus className="w-4 h-4 mr-2" /> 添加
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {data.mode === "guided" && data.elements.length < 8 && (
             <Card className="bg-emerald-50 border-emerald-100 flex-1">
               <CardContent className="p-5">
                 <h3 className="font-medium text-emerald-900 flex items-center mb-2">
                   <Info className="w-4 h-4 mr-2" />
                   引导助手提示
                 </h3>
                 <p className="text-sm text-emerald-800 mb-4 leading-relaxed">
                   为了让分析更丰富，我们通常需要正负面角色都有。如果你不知道加什么，可以考虑：
                   <strong className="block mt-2">
                     "{SUGGESTED_ROLES.find(r => !data.elements.some(e => e.name === r)) || "一个刚认识的人"}"
                   </strong>
                 </p>
                 <Button 
                   size="sm"
                   className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                   onClick={() => {
                     const nextRole = SUGGESTED_ROLES.find(r => !data.elements.some(e => e.name === r));
                     if (nextRole) addElement(nextRole);
                   }}
                 >
                   一键添加建议角色
                 </Button>
               </CardContent>
             </Card>
          )}

          <Card className="bg-indigo-50 border-indigo-100">
            <CardContent className="p-5">
              <h3 className="font-medium text-indigo-900 flex items-center mb-3">
                <Info className="w-4 h-4 mr-2 text-indigo-600" />
                {data.mode === "guided" ? "更多角色库" : "角色库提示"}
              </h3>
              <p className="text-sm text-indigo-800 mb-4 leading-relaxed">
                点击下方标签可快速添加典型角色。选择真实存在且你熟悉的人，这将有助于揭示你深层的评价维度。
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => addElement(role)}
                    disabled={data.elements.some(e => e.name === role)}
                    className="text-xs bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {role}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200 mt-8">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 上一步
        </Button>
        <Button 
          onClick={onNext} 
          disabled={data.elements.length < 6}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          下一步：提取构念 <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      {data.elements.length < 6 && (
        <p className="text-sm text-center text-amber-600">必须添加至少 6 个元素才能进行有效的三元对比提取哦。</p>
      )}
    </div>
  );
}
