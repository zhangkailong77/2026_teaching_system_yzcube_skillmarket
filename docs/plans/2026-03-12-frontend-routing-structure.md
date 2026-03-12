# Frontend Routing & Structure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成前端结构化改造，建立 `src/views` 与页面级路由。  
**Architecture:** 使用 `react-router-dom` 统一路由，`views` 按页面拆分，`components/dashboard` 承载复用壳组件。  
**Tech Stack:** React 19, TypeScript, Vite, react-router-dom

---

### Task 1: Install Routing Dependency

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

1. 安装 `react-router-dom`。
2. 验证依赖可解析。

### Task 2: Build Routing Layer

**Files:**
- Create: `frontend/src/router/index.tsx`
- Create: `frontend/src/router/paths.ts`
- Modify: `frontend/src/App.tsx`

1. 创建路由表与重定向。
2. 将 `App` 改为 `RouterProvider` 入口。

### Task 3: Build Views Layer

**Files:**
- Create: `frontend/src/views/DashboardRouteView.tsx`
- Create: `frontend/src/views/HallView.tsx`
- Create: `frontend/src/views/MyTasksView.tsx`
- Create: `frontend/src/views/PortfolioView.tsx`
- Create: `frontend/src/views/WalletView.tsx`
- Create: `frontend/src/views/AbilityView.tsx`

1. 每个页面创建独立 view 文件。
2. 通过通用 RouteView 连接到 DashboardShell。

### Task 4: Adapt Dashboard Shell

**Files:**
- Create: `frontend/src/components/dashboard/DashboardShell.tsx`

1. 从旧 `App.tsx` 迁移壳组件代码。
2. 将内部页面切换从本地 `setCurrentView` 改为 `onNavigate`。
3. 保留页面内部 tab 状态。

### Task 5: Verification

**Files:**
- N/A

1. 运行 `npm run lint`（tsc noEmit）验证类型和构建入口。
2. 修复报错直到通过。
