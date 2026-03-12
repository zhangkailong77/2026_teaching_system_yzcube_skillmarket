# Frontend Routing & Structure Design

## Goal
在不改变现有 UI 视觉和业务交互的前提下，将前端代码按 `views/components/router` 结构重组，并确保每个业务页面拥有独立路由入口。

## Scope
- 拆分入口为路由驱动。
- 形成 `src/views` 页面层与 `src/components` 组件层。
- 提供 5 个业务页路由：`/hall`、`/my-tasks`、`/portfolio`、`/wallet`、`/ability`。

## Architecture
- `router`：集中定义路由与重定向策略。
- `views`：每个业务页面一个路由视图文件。
- `components/dashboard`：复用当前大屏壳组件和内部页面渲染逻辑，先完成结构治理，再逐步细拆。

## Tradeoff
- 优点：改动相对可控，能快速落地路由化与目录规范。
- 代价：`DashboardShell` 仍较大，后续建议按模块继续切分（TaskCard、WalletPanel、AbilityPanel 等）。
