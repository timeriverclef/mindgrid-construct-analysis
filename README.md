# Repertory Grid Explorer (个人构念网络探索体系)

这是一个基于**乔治·凯利 (George Kelly) 个人构念心理学 (Personal Construct Psychology, PCP)**的交互式网页分析工具。它旨在帮助心理咨询师、研究人员以及希望进行深度自我探索的个人用户，提取潜意识中的认知维度（构念），并揭示可能存在的阻碍成长的“蕴含性困境 (Implicative Dilemmas)”。

## 🌟 核心功能

*   **双模式引导：** 提供“简明模式”供熟悉流程的专业内行使用，以及“引导模式”为新手提供手把手提示与角色推荐，降低探索门槛。
*   **元素确立：** 灵活添加与来访者探索主题相关的现实角色或状态（如“现实自我”、“理想自我”为核心基准点）。
*   **三元对比提取（Triadic Elicitation）：** 通过直观且具备视觉反馈的交互，随机展示三个元素，要求用户找出“两个相似、一个不同”的维度，从而无意识地暴露出他们评价世界的底层“标尺”。
*   **网格动态评分（Grid Rating Matrix）：** 直观顺畅的 1-7 分滑动打分体验。
*   **自动化临床数据分析：**
    *   **蕴含性困境 (IDs) 侦测：** 使用皮尔逊相关系数(Pearson Correlation)锁定阻碍改变的内心冲突。
    *   **热力图呈现：** 直观呈现元素与构念之间的极化关系。
    *   **宏观认知指标：** 自动计算“认知极化率”、“自尊评价系数”以及“感知社交隔离度”。
*   **导出与 AI 解读：** 提供一键生成供外部大语言模型（如 ChatGPT、Claude）深度解读的 Prompt 结构化提示词，协助提供专业的干预建议，并支持一键下载 PDF 作为临床报告归档。

## 🛠️ 技术架构

本项目为一个纯前端单页应用 (SPA)，完全运行在浏览器中，无需后端数据库支持，保障了个人数据的隐私安全。

*   **前端框架：** React 19 + TypeScript
*   **构建工具：** Vite
*   **样式方案：** Tailwind CSS v4 
*   **图标库：** Lucide React
*   **报告导出：** html2canvas + jsPDF

## 🚀 部署与访问

此项目已经配置了 GitHub Actions 工作流，可以直接部署到 GitHub Pages。

### 部署到 GitHub Pages：
1. 将此项目推送到你的 GitHub 仓库。
2. 在该仓库的 **Settings** -> **Pages** 中，将 **Source** 选项（如果出现）修改为通过 GitHub Actions 构建（通常如果是默认配置，它会自动识别 `.github/workflows/deploy.yml`）。
3. 当你向 `main` 分支 `push` 代码时，GitHub Actions 会自动触发打包并部署到 GitHub Pages 上。
4. 部署完成后，你可以在仓库的右侧 "Environments" 区块或 Settings -> Pages 中找到公网访问链接（通常是 `https://<your-username>.github.io/<repository-name>/`）。

### 本地开发与运行：

如果你想在本地基于源代码进行二次开发：

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务器
npm run dev

# 3. 访问浏览器
# 打开 http://localhost:3000
```
