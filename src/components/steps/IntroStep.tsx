import React from "react";
import { useSession } from "@/src/SessionContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { ArrowRight, BookOpen } from "lucide-react";

export default function IntroStep({ onNext }: { onNext: () => void }) {
  const { data, setTheme, setMode } = useSession();

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-2xl space-y-4">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900">欢迎来到认知探索网络</h2>
        <p className="text-lg text-slate-600">
          基于乔治·凯利 (George Kelly) 的个人构念心理学，
          本工具将引导你提取内心深处用来评价自己与他人的潜在标尺（构念），并揭示你可能存在的认知阻碍或心理困境。
        </p>
      </div>

      <Card className="w-full max-w-lg shadow-lg border-slate-200">
        <CardHeader className="bg-slate-50/50 rounded-t-xl border-b border-slate-100">
          <CardTitle className="text-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
            第一步：确立探索主题与模式
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-3">
            <label htmlFor="theme" className="block text-sm font-medium text-slate-700">
              请为本次探索设定一个具体的主题（例如："我的职业选择"、"我的亲密关系"、"症状与自我"）：
            </label>
            <Input
              id="theme"
              value={data.theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="请输入本次访谈的主题..."
              className="text-lg py-6 shadow-inner"
              autoFocus
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-slate-700">
              请选择探索模式：
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setMode("concise")}
                className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${data.mode === 'concise' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <div className="font-semibold text-slate-900 mb-1">简明模式</div>
                <div className="text-xs text-slate-500">自由探索，界面清爽，适合有经验的用户。</div>
              </div>
              <div 
                onClick={() => setMode("guided")}
                className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${data.mode === 'guided' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <div className="font-semibold text-slate-900 mb-1">引导模式</div>
                <div className="text-xs text-slate-500">手把手引导，提供随机建议与提示，适合新手。</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm leading-relaxed border border-blue-100">
            <strong>指导语：</strong>
            接下来，我们将请你列出生活中的几个重要人物或元素。这些元素将作为我们提取你内心“标尺”的基准点。请保持开放和真实的内心状态。
          </div>

          <Button 
            onClick={onNext} 
            disabled={!data.theme.trim()} 
            className="w-full text-lg py-6 bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            开始探索 <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
