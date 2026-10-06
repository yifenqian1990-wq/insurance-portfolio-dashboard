# 保险组合看板 · Insurance Portfolio Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev)
[![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-222.svg)](https://yifenqian1990-wq.github.io/insurance-portfolio-dashboard/)

家庭保单统一管理看板：保单录入归档、保费统计图表、保障缺口分析、AI 助手解读，数据只存在你的浏览器本地。

🌐 **在线体验：https://yifenqian1990-wq.github.io/insurance-portfolio-dashboard/**

## ✨ 功能特性

- 📋 **保单管理**：保单表格化管理，详情抽屉查看，支持成员/家庭维度
- 📄 **文档归档**：保单 PDF 文档上传、预览、归档管理
- 📊 **保费统计**：保费支出、保障额度等多维度图表（Recharts）
- 🔍 **保障分析**：保障缺口检查与更新分析
- 📝 **报告生成**：一键生成保险组合报告
- 🗒️ **备忘笔记**：保单相关笔记记录
- 🤖 **AI 助手**：保单条款解读、保险问答
- 📜 **审计日志**：操作记录可追溯
- 💾 **数据自主**：浏览器本地存储，支持导入导出

## 🚀 快速开始（本地运行）

```bash
git clone https://github.com/yifenqian1990-wq/insurance-portfolio-dashboard.git
cd insurance-portfolio-dashboard
npm install
npm run dev        # http://localhost:3000
```

构建生产包：

```bash
npm run build      # 产物在 dist/，任意静态服务器即可托管
```

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 6 |
| 图表 | Recharts |
| AI 能力 | @google/genai（条款解读、问答）|
| 数据存储 | 浏览器本地 |
| 部署 | GitHub Pages（自动） |

## 📦 部署

本仓库已配置 GitHub Actions，推送到 `main` 分支后自动构建并发布到 GitHub Pages，无需手动操作。

想部署到自己的账号：Fork 本仓库 → Settings → Pages → Source 选择 `GitHub Actions`，推送即生效。

## ❓ FAQ

**Q: 需要 API Key 吗？**
A: AI 助手功能需要。在设置里填入 Gemini API Key，Key 只保存在你的浏览器本地。

**Q: 保单数据会上传吗？**
A: 不会。全部存在浏览器本地，可导入导出备份。

**Q: 上传的 PDF 保单去哪了？**
A: 保存在浏览器本地，不会上传到任何服务器。注意：清浏览器数据前请先导出备份。

## 🔒 隐私说明

本应用处理的是高度敏感的个人保险信息。请注意：浏览器本地存储不加密，公用电脑使用后请清除站点数据；重要保单请保留线下备份。

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证开源。
