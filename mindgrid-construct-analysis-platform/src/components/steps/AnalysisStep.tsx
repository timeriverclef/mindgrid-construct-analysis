import React, { useMemo, useRef, useState } from "react";
import { useSession } from "@/src/SessionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { ArrowLeft, Download, AlertTriangle, ShieldCheck, Zap, Copy, Check, Activity, Heart, Users } from "lucide-react";
import { analyzeGrid } from "@/src/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function AnalysisStep({ onPrev }: { onPrev: () => void }) {
  const { data } = useSession();
  const reportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const { differenceConstructs, consistentConstructs, dilemmas, polarizationRatio, selfEsteemCorrelation, perceivedSocialDistance } = useMemo(() => {
    return analyzeGrid(data.elements, data.constructs, data.ratings);
  }, [data]);

  const realSelfId = data.elements.find(e => e.name === "现实自我" || e.name === "Real Self")?.id;
  const idealSelfId = data.elements.find(e => e.name === "理想自我" || e.name === "Ideal Self")?.id;

  const getConstructById = (id: string) => data.constructs.find(c => c.id === id);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`构念评估报告_${data.theme || "未命名"}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    }
  };

  const generateAIPrompt = () => {
    const elStr = data.elements.map(e => e.name).join(", ");
    
    const constructStr = data.constructs.map((c, i) => {
      const scores = data.elements.map(e => `${e.name}:${data.ratings[c.id]?.[e.id] || '-'}`).join(", ");
      return `${i + 1}. [${c.leftPole} vs ${c.rightPole}] -> 评分: ${scores}`;
    }).join("\n");

    const dilemmaStr = dilemmas.length > 0 ? dilemmas.map(d => {
      const dc = getConstructById(d.differenceConstructId);
      const cc = getConstructById(d.consistentConstructId);
      return `- 渴望改变的维度 [${dc?.leftPole}/${dc?.rightPole}] 与 害怕失去的维度 [${cc?.leftPole}/${cc?.rightPole}] 存在强相关 (r=${d.correlation.toFixed(2)})。`;
    }).join("\n") : "未发现显著的蕴含性困境。";

    const metricsStr = `
临床宏观指标：
- 认知极化率 (Polarization): ${(polarizationRatio * 100).toFixed(1)}% (极端评分1或7的比例)
- 自尊水平评价 (Self-Esteem r): ${selfEsteemCorrelation.toFixed(2)} (现实自我与理想自我的皮尔逊相关系数)
- 社交孤立感 (Social Distance): ${perceivedSocialDistance.toFixed(2)} (现实自我与他人的平均绝对距离，满分6分)
`;

    return `请基于以下乔治·凯利(George Kelly)个人构念网络(Repertory Grid)的原始测试数据，为我提供一份深度的心理分析。

测试主题：${data.theme || '未指定'}
评估元素：${elStr}

构建维度与评分 (1分代表极其靠近左极，7分代表极其靠近右极)：
${constructStr}

系统识别出的潜在认知冲突（蕴含性困境）：
${dilemmaStr}
${metricsStr}

请作为一位资深的个人构念心理治疗师(PCP Therapist)，从以下几个方面为我进行深度解读：
1. 我的整体认知结构有多僵化（非黑即白）还是灵活？
2. 我的“现实自我”与“理想自我”之间的距离说明了什么？
3. 基于那些蕴含性困境，我在意识上渴望做出的改变，到底受到了我潜意识里什么样恐惧的阻碍？
4. 请给我3条切实可行的临床介入或自我提升建议，打破目前的僵局。`;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generateAIPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!realSelfId || !idealSelfId) {
    return (
      <div className="text-center py-20 animate-in fade-in">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">缺少核心元素</h2>
        <p className="text-slate-600 mb-6">必须包含“现实自我”与“理想自我”两个元素才能进行蕴含性困境分析。</p>
        <Button onClick={onPrev} variant="outline">返回修改元素</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">分析报告 (Analysis Report)</h2>
          <p className="text-slate-500">基于评分矩阵计算的个人心理结构与潜在冲突。</p>
        </div>
        <Button onClick={handleDownloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
          <Download className="w-4 h-4 mr-2" /> 下载PDF报告
        </Button>
      </div>

      <div ref={reportRef} className="space-y-8 bg-white p-2 sm:p-8 rounded-xl">
        {/* Header inside Report */}
        <div className="border-b border-slate-200 pb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">心理结构与认知冲突分析报告</h1>
          <p className="text-slate-500 mt-2 font-medium">主题：{data.theme || "无主题"}</p>
        </div>

        {/* Section 1: 核心构念分类 */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-3 border-b border-amber-100">
              <CardTitle className="text-amber-800 flex items-center text-lg">
                <AlertTriangle className="w-5 h-5 mr-2" />
                差异构念 (渴望改变的部分)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-amber-700 opacity-80 mb-4">这些是你认为现实与理想差距极大的领域（分数差≥3）。</p>
              {differenceConstructs.map(id => {
                const c = getConstructById(id);
                return c ? (
                  <div key={id} className="bg-white p-3 rounded shadow-sm text-sm font-medium text-slate-800 flex justify-between border border-amber-100">
                    <span className="text-indigo-600">{c.leftPole}</span>
                    <span className="text-slate-300 px-2">vs</span>
                    <span className="text-rose-600">{c.rightPole}</span>
                  </div>
                ) : null;
              })}
              {differenceConstructs.length === 0 && <p className="text-sm text-slate-500 italic">暂无满足条件的差异构念。</p>}
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardHeader className="pb-3 border-b border-emerald-100">
              <CardTitle className="text-emerald-800 flex items-center text-lg">
                <ShieldCheck className="w-5 h-5 mr-2" />
                一致构念 (满意的核心价值观)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-emerald-700 opacity-80 mb-4">这些是你认为现实与理想高度一致的领域（分数差≤1）。</p>
              {consistentConstructs.map(id => {
                const c = getConstructById(id);
                return c ? (
                  <div key={id} className="bg-white p-3 rounded shadow-sm text-sm font-medium text-slate-800 flex justify-between border border-emerald-100">
                    <span className="text-indigo-600">{c.leftPole}</span>
                    <span className="text-slate-300 px-2">vs</span>
                    <span className="text-rose-600">{c.rightPole}</span>
                  </div>
                ) : null;
              })}
              {consistentConstructs.length === 0 && <p className="text-sm text-slate-500 italic">暂无满足条件的一致构念。</p>}
            </CardContent>
          </Card>
        </div>

        {/* Section 2: 蕴含性困境 (IDs) */}
        <div className="pt-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-indigo-500" />
            核心发现：蕴含性困境 (Implicative Dilemmas)
          </h3>
          <p className="text-slate-600 mb-6 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
            <strong>潜意识冲突：</strong> 在潜意识的网格中，系统发现如果你试图去实现某些“渴望的改变”（差异构念），在你的深层认知里，这可能会牵连导致你失去某些“珍视的特质”（一致构念）。这种进退两难的链接就是<span className="text-rose-600 font-bold">心理防御和停滞不前的真正原因</span>。
          </p>

          <div className="space-y-6">
            {dilemmas.length === 0 ? (
              <div className="text-center p-8 bg-emerald-50 border border-emerald-100 rounded-xl">
                 <p className="text-emerald-800 font-medium">太棒了！算法未探测到显著的蕴含性困境。</p>
                 <p className="text-sm text-emerald-600 mt-2">你在实现理想自我的道路上，内心并不存在强烈的自我矛盾与束缚。</p>
              </div>
            ) : (
              dilemmas.map((d, i) => {
                const dc = getConstructById(d.differenceConstructId);
                const cc = getConstructById(d.consistentConstructId);
                if (!dc || !cc) return null;

                // Determine directional logic for text display
                const dcIdeal = data.ratings[dc.id]?.[idealSelfId] || 4;
                const ccIdeal = data.ratings[cc.id]?.[idealSelfId] || 4;
                
                const dcTargetName = dcIdeal > 4 ? dc.rightPole : (dcIdeal < 4 ? dc.leftPole : "改变");
                const ccThreatenedName = ccIdeal > 4 ? cc.leftPole : (ccIdeal < 4 ? cc.rightPole : "现有特质"); // If negative corr, it moves away to opposite
                                
                return (
                  <Card key={i} className="border-rose-200 shadow-md transform hover:-translate-y-1 transition-transform">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 bg-amber-50 p-4 rounded-lg border border-amber-100 text-center w-full">
                           <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-1">渴望的改变</span>
                           <span className="text-lg font-semibold text-slate-800">{dcTargetName}</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <span className="text-rose-500 font-bold text-xs uppercase bg-rose-50 px-2 py-1 rounded border border-rose-100">潜意识挂钩</span>
                          <div className="w-16 h-1 mt-2 mb-2 bg-gradient-to-r from-amber-400 to-rose-400"></div>
                          <span className="text-xs text-slate-500 font-mono">r={d.correlation.toFixed(2)}</span>
                        </div>

                        <div className="flex-1 bg-rose-50 p-4 rounded-lg border border-rose-100 text-center w-full">
                           <span className="text-xs font-bold text-rose-800 uppercase tracking-widest block mb-1">恐惧沦为</span>
                           <span className="text-lg font-semibold text-slate-800">{ccThreatenedName}</span>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                        <strong>临床解读：</strong> 你的潜意识认为，如果要变得 <strong>"{dcTargetName}"</strong>，就必然会变成 <strong>"{ccThreatenedName}"</strong>。这导致了你在意识上想改变，潜意识却在拼命阻止改变。
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
        
        {/* Section 2.5: Macro Metrics */}
        <div className="pt-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-indigo-500" />
            宏观认知与自我关系指标
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
               <CardContent className="p-6">
                 <div className="flex items-center text-slate-500 mb-2 font-medium">
                   <Activity className="w-4 h-4 mr-2" /> 认知极化程度
                 </div>
                 <div className="text-3xl font-bold text-slate-900 mb-2">{(polarizationRatio * 100).toFixed(1)}<span className="text-lg text-slate-500">%</span></div>
                 <p className="text-xs text-slate-500">极端打分(1或7分)的比例。</p>
                 <div className="mt-3 text-xs bg-slate-50 p-2 rounded text-slate-600">
                    {polarizationRatio > 0.3 ? "你的思维可能存在较强的'非黑即白'倾向，对人或事的评价较为极端。" : (polarizationRatio < 0.1 ? "你的认知非常具有灰度，避免做出绝对的判断。" : "你的认知结构处于适当的弹性范围。")}
                 </div>
               </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
               <CardContent className="p-6">
                 <div className="flex items-center text-slate-500 mb-2 font-medium">
                   <Heart className="w-4 h-4 mr-2 text-rose-400" /> 自尊评价系数 (r)
                 </div>
                 <div className="text-3xl font-bold text-slate-900 mb-2">{selfEsteemCorrelation.toFixed(2)}</div>
                 <p className="text-xs text-slate-500">现实与理想自我的相关系数。</p>
                 <div className="mt-3 text-xs bg-slate-50 p-2 rounded text-slate-600">
                    {selfEsteemCorrelation > 0.5 ? "现实与理想较为一致，你对当前的自己总体感到满意。" : (selfEsteemCorrelation < 0 ? "理想与现实出现背离，暗示着较强的自我否定。" : "现实与理想存在一定距离，这是成长的良好动力。")}
                 </div>
               </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
               <CardContent className="p-6">
                 <div className="flex items-center text-slate-500 mb-2 font-medium">
                   <Users className="w-4 h-4 mr-2 text-emerald-500" /> 感知社交距离
                 </div>
                 <div className="text-3xl font-bold text-slate-900 mb-2">{perceivedSocialDistance.toFixed(1)}<span className="text-lg text-slate-500 font-normal"> / 6</span></div>
                 <p className="text-xs text-slate-500">与他人的平均心理维度差异。</p>
                 <div className="mt-3 text-xs bg-slate-50 p-2 rounded text-slate-600">
                    {perceivedSocialDistance > 3.5 ? "感觉自己与周围人存在显著心理差异，可能带有孤独或独特性。" : (perceivedSocialDistance < 1.5 ? "觉得大家基本相似，可能存在边界模糊或高度群体认同感。" : "与他人的心理距离保持在适中、健康的范围。")}
                 </div>
               </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 3: 原始矩阵渲染 (Heatmap) */}
        <div className="pt-8">
           <h3 className="text-xl font-bold text-slate-900 mb-6">全景构念得分矩阵 (Score Matrix)</h3>
           <div className="overflow-x-auto rounded-xl border border-slate-200 pt-8 mt-[-2rem] bg-white">

             <table className="w-full text-sm text-left text-slate-600 whitespace-nowrap">
               <thead className="bg-slate-900 text-white sticky top-0">
                 <tr>
                   <th className="px-4 py-3 font-medium">潜在构念 (左界)</th>
                   <th className="px-4 py-3 font-medium border-r border-slate-700">潜在构念 (右界)</th>
                   {data.elements.map(e => (
                     <th key={e.id} className="px-4 py-3 text-center border-r border-slate-700 font-medium font-mono text-[11px] truncate max-w-[80px]">
                       {e.name}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {data.constructs.map((c, i) => (
                   <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                     <td className="px-4 py-3 font-medium text-indigo-700">{c.leftPole}</td>
                     <td className="px-4 py-3 font-medium text-rose-700 border-r border-slate-100">{c.rightPole}</td>
                     {data.elements.map(e => {
                       const score = data.ratings[c.id]?.[e.id] || 0;
                       // Heatmap logic
                       const intensity = Math.abs(score - 4);
                       const isHigh = score > 4;
                       const isLow = score < 4;
                       
                       let bgColor = "bg-slate-50";
                       let textColor = "text-slate-500";
                       
                       if (intensity === 3) {
                         if (isLow) { bgColor = "bg-indigo-500"; textColor = "text-white"; }
                         if (isHigh) { bgColor = "bg-rose-500"; textColor = "text-white"; }
                       } else if (intensity === 2) {
                         if (isLow) { bgColor = "bg-indigo-300"; textColor = "text-indigo-900"; }
                         if (isHigh) { bgColor = "bg-rose-300"; textColor = "text-rose-900"; }
                       } else if (intensity === 1) {
                         if (isLow) { bgColor = "bg-indigo-100 text-indigo-800"; }
                         if (isHigh) { bgColor = "bg-rose-100 text-rose-800"; }
                       }

                       return (
                         <td key={e.id} className="p-0 border-r border-slate-100 text-center relative group">
                           <div className={`w-full h-full min-h-[44px] flex items-center justify-center font-bold ${bgColor} ${textColor} transition-colors group-hover:ring-2 group-hover:ring-inset group-hover:ring-indigo-400 group-hover:brightness-110 cursor-default`}>
                             {score || "-"}
                           </div>
                           
                           {score > 0 && (
                             <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-slate-900 text-white text-xs rounded-lg py-2.5 px-3 z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 w-max shadow-xl border border-slate-700 min-w-[220px]">
                                <div className="font-semibold text-indigo-300 border-b border-slate-700 pb-1.5 mb-2 text-center text-sm">{e.name}</div>
                                <div className="flex justify-between items-center bg-slate-800 rounded p-1.5 mb-2">
                                  <span className={`w-2/5 text-right line-clamp-2 leading-tight break-words ${score < 4 ? "text-white font-medium" : "text-slate-400"}`}>{c.leftPole}</span>
                                  <span className="w-1/5 text-center text-slate-500 font-mono text-[10px]">vs</span>
                                  <span className={`w-2/5 text-left line-clamp-2 leading-tight break-words ${score > 4 ? "text-white font-medium" : "text-slate-400"}`}>{c.rightPole}</span>
                                </div>
                                <p className="text-center font-mono text-emerald-400 font-bold bg-slate-950 rounded py-0.5 mt-1 border border-slate-800 tracking-wider">评分 {score}</p>
                                
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[6px] border-transparent border-t-slate-900"></div>
                             </div>
                           )}
                         </td>
                       );
                     })}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Section 4: AI 深度分析助手 */}
        <div className="pt-8">
           <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              AI 深度解读助手
           </h3>
           <Card className="border-indigo-200 bg-indigo-50/50">
             <CardContent className="p-6">
                <p className="text-sm text-slate-700 mb-4">
                  如果你觉得以上数据图表难以解读，或者想听听更多临床见解。你可以一键复制系统为你生成的 <strong>【专家级结构化提示词】</strong>，并发送给你常用的 AI（如 ChatGPT、Claude 或 Kimi），让其为你进行深度解读和咨询建议。
                </p>
                <div className="relative">
                  <textarea 
                    readOnly 
                    value={generateAIPrompt()} 
                    className="w-full text-xs font-mono text-slate-600 bg-white p-4 rounded-lg border border-slate-200 h-48 focus:outline-none"
                  />
                  <Button 
                    onClick={handleCopyPrompt} 
                    className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    size="sm"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "已复制" : "复制给 AI"}
                  </Button>
                </div>
             </CardContent>
           </Card>
        </div>

      </div>

      <div className="flex justify-start pt-6 border-t border-slate-200 mt-8">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 返回修改评分
        </Button>
      </div>
    </div>
  );
}
