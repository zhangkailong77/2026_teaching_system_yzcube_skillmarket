# YZCube SkillMarket 交接说明

> 这份文档是按“马上离职、需要把后续同事一次性交接清楚”的标准整理的。
> 目标不是写产品宣传，而是让接手的人能 **看完就知道怎么配环境、怎么本地跑、怎么部署、怎么排查问题、当前系统做到哪一步、哪里最容易踩坑**。

---

## 1. 项目概述

YZCube SkillMarket 是一个 **企业任务大厅 / 任务广场** 项目，定位是：

- **前端**：任务广场、我的任务、能力页、作品集、钱包、后台演示页、SSO 回调页
- **后端**：FastAPI 提供认证、联邦 SSO、任务列表、抢单、我的任务等接口
- **对接关系**：
  - 企业用户可在本系统注册/登录
  - 学校教学系统用户通过 **联邦 SSO** 免登录进入任务大厅
  - 后端支持基于 RBAC 的管理员/普通用户权限模型

### 部署定位（这个一定要先讲清楚）

这个项目的业务前提不是“两边都部署在同一台服务器”，而是：

- **教学系统**：每个学校一套，通常是**本地部署 / 校内部署**
- **SkillMarket 任务市场**：统一一套，通常是**云服务器集中部署**

也就是说，真实形态是：

```text
学校A本地教学系统 ─┐
学校B本地教学系统 ─┼──> 云端统一 SkillMarket
学校C本地教学系统 ─┘
```

这意味着接手人必须理解两件事：

1. **教学系统不是这个仓库的一部分**，但必须和这个市场系统对接
2. **市场系统上线后，不是单独跑起来就结束了**，还要让每个学校本地教学系统完成联邦配置与回调对接

### 当前代码仓状态

这个仓库目前是一个 **前后端分离但同仓维护** 的项目：

- `frontend/`：React 19 + Vite + TypeScript
- `backend/`：FastAPI + SQLAlchemy + MySQL/SQLite
- `docs/`：设计稿、开发计划、架构说明

### 当前已实现能力

已实现/可联调的核心能力：

1. 健康检查接口
2. 企业账号注册 / 登录 / 刷新 token / 获取当前用户
3. 教学系统联邦 SSO 票据兑换
4. 教学系统用户同步接口
5. 任务广场列表
6. 抢单接口
7. 我的任务列表
8. RBAC 基础模型与后台演示页权限拦截

### 当前未完善或仍属演示/半成品的部分

下面这些要明确告诉接手人，避免误判“已经上线可用”：

- 前端后台页 `/admin` 目前主要是 **静态展示壳子 + 前端角色拦截**，不等于后台功能已全部打通
- 企业发单、任务审核、钱包结算、作品提交流程都还不是完整闭环
- 仓库里 **没有标准化部署脚本**（如 Docker Compose / systemd / nginx 配置未沉淀在仓库），目前部署方式更偏手工
- SSO 联调依赖教学系统提供的票据签发能力，单独跑本仓库时只覆盖“消费票据”这一半

---

## 2. 仓库结构

```text
.
├── README.md                    # 当前交接文档（建议以后只维护这一份总说明）
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── services/            # 前端 API 调用
│   │   ├── router/              # 路由配置
│   │   └── views/               # 页面视图
│   ├── .env.example             # 前端环境变量示例
│   ├── package.json             # 前端脚本与依赖
│   └── vite.config.ts           # Vite 配置
├── backend/                     # 后端项目
│   ├── app/
│   │   ├── api/v1/endpoints/    # 接口路由
│   │   ├── core/                # 配置、安全
│   │   ├── db/                  # 数据库连接
│   │   ├── models/              # SQLAlchemy 模型
│   │   ├── schemas/             # Pydantic schema
│   │   └── services/            # 业务服务
│   ├── scripts/                 # 初始化 / 回填 / 注释脚本
│   ├── sql/                     # 建表 SQL
│   ├── tests/                   # 后端测试
│   ├── .env.example             # 后端环境变量示例
│   └── requirements.txt         # 后端依赖
└── docs/                        # 设计与实施计划文档
```

---

## 3. 技术栈与运行方式

### 前端

- React 19
- TypeScript
- Vite
- react-router-dom
- recharts
- lucide-react
- Tailwind CSS（通过 `@tailwindcss/vite`）

### 后端

- FastAPI
- SQLAlchemy 2.x
- PyMySQL
- python-jose
- passlib / bcrypt
- Redis（可选，用于防重放；不可用时会退化为内存存储）

### 数据库

后端支持两种运行方式：

1. **本地调试默认推荐：SQLite**
   - 不用额外装 MySQL
   - 配置简单
   - 适合前后端联调 / 功能自测
2. **联调/部署：MySQL**
   - `.env.example` 里给的是 MySQL 连接方式
   - 建议生产使用 MySQL 8+

---

## 4. 核心架构与调用链

### 4.1 本地账号链路（企业账号）

1. 前端调用 `POST /api/v1/auth/register` 注册
2. 前端调用 `POST /api/v1/auth/login` 登录
3. 后端返回 access token + refresh token
4. 前端把 access token 存在 localStorage
5. 前端调用 `GET /api/v1/auth/me` 获取当前用户信息

### 4.2 部署拓扑与系统边界

#### 教学系统（学校侧）

教学系统是**学校本地部署**的，通常由学校自己的服务器、内网环境或校方运维维护。
它负责：

- 学校用户登录
- 学号/账号/角色管理
- 课程、考试、进度等教学数据
- SSO ticket 的签发
- （可选）向市场同步用户基础信息

#### 任务市场（平台侧）

SkillMarket 是**云服务器统一部署**的。
它负责：

- 企业任务发布与任务市场展示
- 抢单、任务流转、我的任务
- 教学系统 SSO ticket 的消费与会话建立
- 跨学校用户身份映射
- 后续的企业侧、审核侧、钱包侧能力

#### 两边的关系

不是“市场去替代教学系统”，而是：

- 教学系统继续做学校内业务主系统
- 市场系统只做统一的云端任务平台
- 用户从教学系统进入市场时，通过联邦 SSO 建立免登录访问

所以每次给新学校部署教学系统时，都要额外做一件事：

> **把这个本地教学系统和云端 SkillMarket 做联邦对接。**

### 4.3 教学系统 SSO 链路

1. 用户先在教学系统完成登录
2. 教学系统签发一次性 `ticket`
3. 教学系统把用户跳转到云端市场的 `/sso/callback?ticket=...`
4. 市场前端回调页调用 `POST /hall/federation/sso/exchange`
5. 市场后端校验 ticket：签名、过期时间、iss、aud、typ、school_id、jti
6. 校验通过后，市场系统生成自己的一份 session token
7. 前端保存 token 后跳到 `/my-tasks`


### 4.4 任务广场链路

1. 前端调用 `GET /api/v1/tasks`
2. 用户点击“立即接单”
3. 前端调用 `POST /api/v1/tasks/{task_id}/claim`
4. 后端检查登录态、角色权限、任务状态、是否重复接单
5. 成功后写入 `task_claims`

---

## 5. 运行环境要求

### 前端要求

- Node.js 18+（建议 20 LTS）
- npm 9+

### 后端要求

- Python 3.12
- 建议使用 Conda 环境隔离
- 如果要使用 Redis 防重放，准备一个 Redis 实例

### 操作系统建议

- 本地开发：macOS / Linux 都可
- 部署环境：Linux（Ubuntu 22.04 / CentOS 7+ / Rocky Linux 等均可）

---

## 6. 环境变量说明

> **很重要：后端把 `backend/.env` 视为运行时真值来源。**
> `backend/app/core/config.py` 会主动读取 `backend/.env` 并覆盖环境变量。
> 所以如果你改了 shell 里的环境变量但没改 `backend/.env`，最终以后者为准。

### 6.1 前端环境变量

文件：`frontend/.env`

可参考：`frontend/.env.example`

当前前端实际会用到：

| 变量名 | 说明 | 示例 |
|---|---|---|
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://127.0.0.1:8000` |
| `VITE_TEACHING_SYSTEM_URL` | SSO 失败后返回教学系统的地址 | `http://127.0.0.1:8000` |

**注意：**

- 前端代码里 `auth.ts` / `tasks.ts` 的默认后端地址是 `http://127.0.0.1:8000`
- 但 `frontend/.env.example` 里历史上写过 `8001`
- **本地调试建议统一按 `8000` 走，避免前后端端口对不上**

推荐本地配置：

```env
VITE_API_BASE_URL="http://127.0.0.1:8000"
VITE_TEACHING_SYSTEM_URL="http://127.0.0.1:8000"
```

### 6.2 后端环境变量

文件：`backend/.env`

可参考：`backend/.env.example`

核心变量如下：

| 变量名 | 说明 |
|---|---|
| `APP_NAME` | 应用名称 |
| `APP_VERSION` | 应用版本 |
| `API_V1_PREFIX` | API 前缀，默认 `/api/v1` |
| `DEBUG` | 是否开启 debug |
| `DATABASE_URL` | 数据库连接串 |
| `JWT_SECRET_KEY` | access token 签名密钥 |
| `JWT_ALGORITHM` | JWT 算法，默认 `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | access token 过期分钟数 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | refresh token 过期天数 |
| `SESSION_SECRET` | SSO session token 签名密钥 |
| `SESSION_EXPIRE_MINUTES` | SSO session 过期分钟数 |
| `REDIS_URL` | Redis 地址，用于防重放 |
| `FEDERATION_SECRET` | 联邦 SSO 对称签名密钥 |
| `FEDERATION_PUBLIC_KEY` | 联邦 SSO 非对称验签公钥（如果走 RSA） |
| `FEDERATION_EXPECTED_AUD` | 期望的 aud |
| `FEDERATION_TRUSTED_ISSUERS` | 受信任的学校/发行方列表，逗号分隔 |
| `FEDERATION_SYNC_MAX_SKEW_SECONDS` | 用户同步接口允许的时间偏差 |
| `CORS_ORIGINS` | 允许跨域的前端地址 |
| `CORS_ORIGIN_REGEX` | 允许跨域的正则 |

### 6.3 链条密钥设计（这套系统的特色逻辑，务必看懂）

这套系统不是只用一个密钥做所有事情，而是做了一个**分层但可回退的链条密钥设计**。
核心目的是：

- 区分 **本地账号登录 token**、**SSO 会话 token**、**联邦票据验签/同步签名** 这三类安全用途
- 在配置不完整时允许按链条回退，减少联调初期因为缺参导致系统完全起不来
- 让接手人知道：**哪把钥匙是干什么的，错了会影响哪一段链路**

#### 设计分层

从用途上分三层：

1. **JWT_SECRET_KEY**
   - 用于企业账号/本地账号登录后的 access token 签发
   - 即 `/api/v1/auth/login`、`/api/v1/auth/refresh` 这条链路

2. **SESSION_SECRET**
   - 用于教学系统 SSO 票据兑换成功后，任务大厅自己签发的 session token
   - 即 `/hall/federation/sso/exchange` 成功后返回的 token

3. **FEDERATION_SECRET / FEDERATION_PUBLIC_KEY**
   - 用于联邦链路
   - 包括：
     - SSO ticket 验签
     - `/hall/federation/users/sync` 的 HMAC 签名校验
   - 如果配置 `FEDERATION_PUBLIC_KEY`，优先按公钥验签
   - 如果没配公钥，则退回使用 `FEDERATION_SECRET`

#### 回退关系（这是最关键的“链条”）

后端配置代码里，三层密钥不是完全独立的，而是允许按下面顺序回退：

```text
JWT_SECRET_KEY
   ↓（如果没单独配 SESSION_SECRET）
SESSION_SECRET
   ↓（如果没单独配 FEDERATION_SECRET）
FEDERATION_SECRET
```

也就是说：

- `SESSION_SECRET` 默认会回退到 `JWT_SECRET_KEY`
- `FEDERATION_SECRET` 默认会回退到 `SESSION_SECRET`
- 所以在最简配置下，三段链路可以共用一套密钥跑起来

这就是我这里说的“链条密钥设计”：
**优先独立、其次继承、最后兜底。**

#### 代码里的具体行为

1. **本地登录 token 签发**
   - `create_access_token()` 使用 `JWT_SECRET_KEY` 签发

2. **SSO session token 签发**
   - `exchange_ticket()` 在 ticket 验证通过后，使用 `SESSION_SECRET` 再签一个任务大厅自己的 session token
   - 所以教学系统票据本身不会直接作为大厅长期会话使用，而是会“兑换”成大厅自己的 token

3. **统一鉴权兼容两类 token**
   - `decode_access_token()` 会先尝试用 `JWT_SECRET_KEY` 解 token
   - 如果失败，再尝试 `SESSION_SECRET`
   - 这个设计的作用是：`/api/v1/auth/me`、任务接口等可以同时识别：
     - 企业登录拿到的本地 access token
     - SSO 兑换后得到的大厅 session token

4. **联邦验签 key 选择逻辑**
   - `_federation_verify_key()` 优先返回 `FEDERATION_PUBLIC_KEY`
   - 没有公钥时再返回 `FEDERATION_SECRET`
   - 所以这套实现同时兼容：
     - 对称密钥模式（HS256）
     - 非对称验签模式（RS256）

5. **用户同步接口和 SSO 票据复用同一联邦信任根**
   - `/hall/federation/sso/exchange` 用同一个 federation verify key 验证 ticket
   - `/hall/federation/users/sync` 也用同一个 federation verify key 做 HMAC 签名比对
   - 也就是说：
     - **SSO 登录信任** 和 **用户同步信任** 是挂在同一条联邦密钥链上的

#### 为什么这么设计

这套设计不是为了“炫技巧”，而是为了解决三个实际问题：

1. **联调初期配置常常不全**
   - 如果要求三套密钥必须一次性配全，联调经常一开始就卡死
   - 现在可以先共用，跑通后再拆开

2. **SSO token 和本地登录 token 语义不同**
   - 最好不要完全混为一种 token
   - 所以代码层面保留了 `SESSION_SECRET` 这个独立层

3. **后续可以平滑升级安全策略**
   - 初期可以全走对称密钥
   - 后期可以把联邦部分切到 `FEDERATION_PUBLIC_KEY` / `RS256`
   - 不影响本地登录 token 这一层

#### 实际配置建议

##### 开发环境

可以先简单一点：

```env
JWT_SECRET_KEY=dev-secret-key
SESSION_SECRET=dev-session-secret
FEDERATION_SECRET=dev-federation-secret
```

如果只是本地单机自测，其实三者临时配成一样也能工作，但**不建议长期这么做**。

##### 生产环境

强烈建议三层拆开：

- `JWT_SECRET_KEY`：只负责本地账号 token
- `SESSION_SECRET`：只负责 SSO 兑换后的大厅 session
- `FEDERATION_SECRET` / `FEDERATION_PUBLIC_KEY`：只负责跨系统联邦信任

#### 这套链条里最容易踩坑的地方

1. **改了 JWT_SECRET_KEY，企业登录 token 会失效**
   - 影响 `/api/v1/auth/login` 这条链路签出的 token

2. **改了 SESSION_SECRET，SSO 已登录用户会失效**
   - 影响 SSO 兑换出来的大厅 session token

3. **改了 FEDERATION_SECRET / FEDERATION_PUBLIC_KEY，会直接影响跨系统联调**
   - 可能出现：
     - `invalid ticket signature`
     - `invalid_signature`

4. **如果你没有显式配三套密钥，改上游一套值，可能连带影响下游两层**
   - 因为存在回退链条
   - 所以接手时务必先确认当前环境到底是“独立配置”还是“继承配置”

5. **`backend/.env` 是最终真值来源**
   - 这意味着链条回退也是基于 `backend/.env` 最终加载结果计算的
   - 不要只看 shell 里的 `export`

#### 一句话总结

这套密钥逻辑可以理解成：

> **本地登录一把钥匙、SSO 会话一把钥匙、联邦信任一把钥匙；三把钥匙允许按链条兜底继承，但正式环境最好彻底拆开。**

### 6.4 本地调试推荐的后端 `.env`

如果只是本地调试，推荐先用 SQLite：

```env
APP_NAME=YZCube SkillMarket API
APP_VERSION=0.1.0
API_V1_PREFIX=/api/v1
DEBUG=true
DATABASE_URL=sqlite:///./backend_local.db
JWT_SECRET_KEY=dev-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
SESSION_SECRET=dev-session-secret
SESSION_EXPIRE_MINUTES=120
REDIS_URL=redis://127.0.0.1:6379/0
FEDERATION_SECRET=dev-federation-secret
FEDERATION_EXPECTED_AUD=yzcube-skillmarket
FEDERATION_TRUSTED_ISSUERS=teaching-yzcube-school,yzcube-school
FEDERATION_SYNC_MAX_SKEW_SECONDS=300
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ORIGIN_REGEX=^https?://(localhost|127\\.0\\.0\\.1):3000$
```

---

## 7. 本地开发启动说明（最重要）

建议先按下面顺序来，不要自己发散：

### 7.1 启动后端

#### 方式 A：Conda + SQLite（最省事，推荐）

```bash
conda create -y -n yzsm-py312 python=3.12
conda run --no-capture-output -n yzsm-py312 python -m pip install -r backend/requirements.txt
```

把 `backend/.env` 配成 SQLite 后，启动：

```bash
cd backend
conda run --no-capture-output -n yzsm-py312 uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后检查：

- 根路径：`http://127.0.0.1:8000/`
- 健康检查：`http://127.0.0.1:8000/api/v1/health`

#### 方式 B：MySQL 联调

1. 准备好 MySQL 数据库
2. 修改 `backend/.env` 中 `DATABASE_URL`
3. 再执行上面的 uvicorn 启动命令

**说明：**

- 后端启动时会执行 `Base.metadata.create_all(bind=engine)`
- 也就是：**模型里已有的表会自动尝试创建**
- 但像角色、权限、历史字段回填、表注释这些，需要额外执行脚本

### 7.2 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认前端监听：

- `http://127.0.0.1:3000`
- `http://localhost:3000`

### 7.3 本地联调检查顺序

建议按这个顺序确认，不然很容易在错误方向上浪费时间：

1. 后端健康检查是否通
2. 前端是否能打开主页 `/hall`
3. 前端请求的 `VITE_API_BASE_URL` 是否正确
4. 浏览器控制台是否有 CORS 报错
5. 后端 `.env` 是否真的生效
6. 数据库连接是否正常

---

## 8. 数据库初始化与脚本说明

### 8.1 自动建表

后端启动时会根据模型自动建表，覆盖的核心表包括：

- `users`
- `refresh_tokens`
- `hall_users`
- `tasks`
- `task_claims`
- `task_favorites`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `audit_logs`

### 8.2 SQL 文件说明

目录：`backend/sql/`

| 文件 | 用途 |
|---|---|
| `task_hall_schema.sql` | 任务相关核心表结构 |
| `admin_rbac_schema.sql` | 管理端 RBAC 相关表结构 |
| `table_comments.sql` | 表注释 |

### 8.3 Python 脚本说明

目录：`backend/scripts/`

| 脚本 | 作用 |
|---|---|
| `seed_rbac.py` | 初始化角色、权限，并可创建/绑定超级管理员 |
| `backfill_user_roles.py` | 根据已有用户数据回填角色 |
| `backfill_task_selection_config.py` | 给历史任务补 `selection_mode` / `accept_quota` |
| `backfill_task_card_fields.py` | 补任务卡片展示字段、企业名、截止时间等 |
| `apply_table_comments.py` | 给表补注释 |
| `apply_column_comments.py` | 给字段补注释 |

### 8.4 推荐初始化顺序（MySQL 环境）

如果是新部署或接手一个空库，建议顺序：

```bash
cd backend

# 1) 先启动一次服务，让 SQLAlchemy 自动建表
conda run --no-capture-output -n yzsm-py312 uvicorn app.main:app --host 0.0.0.0 --port 8000
# 确认启动成功后 Ctrl+C

# 2) 初始化 RBAC
conda run --no-capture-output -n yzsm-py312 python scripts/seed_rbac.py \
  --super-username admin \
  --super-password '请改成真实密码'

# 3) 如果库里已有老用户，再回填角色
conda run --no-capture-output -n yzsm-py312 python scripts/backfill_user_roles.py --super-username admin

# 4) 如果是旧任务数据，再回填历史字段
conda run --no-capture-output -n yzsm-py312 python scripts/backfill_task_selection_config.py
conda run --no-capture-output -n yzsm-py312 python scripts/backfill_task_card_fields.py

# 5) 可选：补表/字段注释
conda run --no-capture-output -n yzsm-py312 python scripts/apply_table_comments.py
conda run --no-capture-output -n yzsm-py312 python scripts/apply_column_comments.py
```

**注意：**

- `seed_rbac.py` 最关键，不执行的话很多权限逻辑会不完整
- 如果只本地跑页面，不一定每个脚本都要跑
- 但如果要访问 `/admin` 并测试管理员角色，至少要把管理员账号和 RBAC 种出来

---

## 9. 常用接口清单

### 基础

- `GET /`：服务根路径
- `GET /api/v1/health`：健康检查

### 认证

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

### 任务

- `GET /api/v1/tasks`
- `POST /api/v1/tasks/{task_id}/claim`
- `GET /api/v1/tasks/my`

### 联邦 / SSO

- `POST /hall/federation/sso/exchange`
- `POST /hall/federation/users/sync`

### 后台演示

- `GET /api/v1/admin/dashboard`

---

## 10. 前端页面与路由说明

当前主要路由：

| 路由 | 说明 |
|---|---|
| `/hall` | 任务广场首页 |
| `/my-tasks` | 我的任务 |
| `/portfolio` | 作品集页（UI 为主） |
| `/wallet` | 钱包页（UI 为主） |
| `/ability` | 能力页 |
| `/publish` | 企业发单位（当前主要是壳） |
| `/admin` | 管理后台演示页 |
| `/sso/callback` | 教学系统联邦登录回调页 |

### `/admin` 权限说明

前端页面会从 localStorage 里读取 `yzcube_auth_roles` 判断是否允许进入后台。

允许进入的角色：

- `super_admin`
- `sub_admin`

如果只是创建了普通企业账号，没有给角色，打开 `/admin` 会看到“无后台访问权限”。

---

## 11. 本地调试手册

这部分是给接手的人最快排错用的。

### 11.1 调试企业注册/登录

1. 启动前后端
2. 打开前端页面
3. 注册企业账号
4. 登录
5. 看浏览器 localStorage 是否写入：
   - `yzcube_access_token`
   - `yzcube_refresh_token`
   - `yzcube_auth_username`
6. 调 `/api/v1/auth/me` 看是否返回当前用户

### 11.2 调试管理员后台

推荐流程：

1. 执行 `seed_rbac.py` 创建超级管理员
2. 用该账号登录
3. 确认 localStorage 中有管理员角色
4. 访问 `/admin`

如果页面提示无权限，优先排查：

- 用户是否被分配 `super_admin` 或 `sub_admin`
- 前端 localStorage 中 `yzcube_auth_roles` 是否正确
- `/api/v1/auth/me` 返回 roles 是否正确

### 11.3 调试 SSO 回调

前端 SSO 回调页地址：

```text
/sso/callback?ticket=xxx&return_url=http://教学系统地址
```

排查顺序：

1. URL 上是否真的带了 `ticket`
2. `FEDERATION_SECRET` / `FEDERATION_PUBLIC_KEY` 是否与教学系统一致
3. `FEDERATION_EXPECTED_AUD` 是否一致
4. `FEDERATION_TRUSTED_ISSUERS` 是否包含教学系统的 `iss`
5. 服务器时间是否同步
6. Redis 是否可用（不通也能退化成内存，但多实例部署时会有风险）

回调页对以下错误有明确中文提示：

- ticket expired
- ticket already used
- invalid ticket signature
- invalid ticket type
- untrusted issuer

### 11.4 调试任务广场 / 抢单

排查顺序：

1. `/api/v1/tasks` 是否能正常返回列表
2. 用户是否已登录
3. 用户是否有 `hall.task.claim` 权限
4. 任务状态是否为 `open`
5. 任务是否已过期
6. 是否重复接单

---

## 12. 测试与验证命令

### 后端测试

```bash
cd backend
conda run --no-capture-output -n yzsm-py312 pytest -q
```

覆盖内容主要包括：

- 健康检查
- 注册 / 登录 / 刷新 / me
- SSO ticket 兑换
- SSO ticket 防重放
- 用户同步后密码登录

### 后端语法/编译检查

```bash
PYTHONPYCACHEPREFIX=/tmp/python-pycache python3 -m compileall backend
```

### 前端类型检查

```bash
cd frontend
npm run lint
```

> 这里的 `lint` 实际上是 `tsc --noEmit`，本质是类型检查，不是 ESLint。

### 前端构建

```bash
cd frontend
npm run build
```

---

## 13. 部署说明（基于当前仓库的实际情况）

> 仓库当前没有现成的一键部署方案。
> 所以下面写的是 **“按当前代码能落地的推荐部署方式”**，不是已经沉淀好的运维规范。

### 13.1 推荐部署拓扑

要把这套系统理解成 **“云端一个市场 + 多个学校本地教学系统”**。

```text
[学校本地服务器]
  教学系统A
    └─ 签发 ticket / 用户同步

[学校本地服务器]
  教学系统B
    └─ 签发 ticket / 用户同步

[云服务器]
  Nginx
  Frontend(dist)
  FastAPI Backend
  MySQL
  Redis
```

建议至少拆成这几层：

1. **前端静态资源**：Vite build 后由 Nginx 托管
2. **后端 API**：FastAPI + Uvicorn
3. **MySQL**：业务数据库
4. **Redis**：SSO / 同步接口防重放
5. **Nginx 反代**：统一域名入口，转发 `/api/` 与前端静态站点
6. **学校本地教学系统**：不在本仓内部署，但必须和云端市场联邦打通

### 13.2 部署前要准备的配置

至少确认下面这些：

#### 云端市场侧

- 正式数据库连接串
- 正式 JWT / Session / Federation 密钥
- 前端正式 API 地址
- CORS 白名单
- 对外访问域名（例如市场域名）
- 是否需要 HTTPS（正式环境强烈建议）

#### 学校本地教学系统侧

每个学校在本地部署教学系统时，都要额外配置一组“市场对接参数”。
最少要确认：

- 市场前端访问地址（例如 `https://market.xxx.com`）
- 市场 SSO 回调落点（前端回调页）
- 市场后端联邦接口地址：
  - `POST /hall/federation/sso/exchange`
  - `POST /hall/federation/users/sync`
- `school_id`（每个学校必须唯一）
- `iss`（建议与学校标识一一对应）
- `aud`（应与市场期望值一致，默认 `yzcube-skillmarket`）
- 联邦密钥（`FEDERATION_SECRET` 或公私钥方案）
- ticket 有效期
- 教学系统跳转市场时带的 `return_url`

#### 一定要统一的联邦参数

教学系统和市场系统两边必须对齐：

- `school_id`
- `iss`
- `aud`
- 联邦密钥
- ticket 声明字段格式
- 时间同步（NTP）

### 13.3 前端部署步骤

```bash
cd frontend
npm install
npm run build
```

构建产物在：

- `frontend/dist/`

把 `dist/` 交给 Nginx 托管即可。

### 13.4 后端部署步骤

```bash
conda create -y -n yzsm-py312 python=3.12
conda run --no-capture-output -n yzsm-py312 python -m pip install -r backend/requirements.txt
```

准备 `backend/.env` 后启动：

```bash
cd backend
conda run --no-capture-output -n yzsm-py312 uvicorn app.main:app --host 0.0.0.0 --port 8000
```

正式环境建议不要裸跑，建议至少挂到：

- `systemd`
- `supervisor`
- 或其他进程守护工具

### 13.5 Nginx 反代建议

虽然仓库没有现成配置，但建议反代思路如下：

- `/` -> 前端静态站点
- `/api/` -> `127.0.0.1:8000`
- `/hall/` -> `127.0.0.1:8000`

之所以 `/hall/` 也要反代，是因为联邦接口路径不是 `/api/v1/...`，而是：

- `/hall/federation/sso/exchange`
- `/hall/federation/users/sync`

### 13.6 首次上线后必做检查

上线后不要只看页面能打开，至少要检查：

1. `GET /api/v1/health` 是否正常
2. 企业账号是否能注册 / 登录
3. `GET /api/v1/tasks` 是否能返回数据
4. SSO 回调是否可访问
5. `seed_rbac.py` 是否已执行
6. 管理员账号是否可进入 `/admin`
7. CORS 是否只放开必要域名
8. 正式密钥是否已替换示例值

---

## 14. 操作说明（接手人最常用）

### 14.1 新增一个管理员账号

方式一：直接用脚本创建超级管理员

```bash
cd backend
conda run --no-capture-output -n yzsm-py312 python scripts/seed_rbac.py \
  --super-username admin2 \
  --super-password '强密码'
```

方式二：先注册普通用户，再用数据库或角色回填脚本赋权

### 14.2 给现有用户补角色

```bash
cd backend
conda run --no-capture-output -n yzsm-py312 python scripts/backfill_user_roles.py --super-username admin
```

### 14.3 教学系统本地部署后，如何与市场对接

这是交接里最容易漏掉，但实际上最关键的一步。

**结论先说：每给一个学校本地部署教学系统，都必须再做一次“对接云端市场”的配置。**

不是部署完教学系统就自动能进市场，至少还要完成以下事项。

#### 教学系统侧需要做的事

1. 配置市场访问地址
   - 让教学系统知道云端市场的正式域名

2. 配置 SSO 跳转地址
   - 用户点击“进入任务市场”时，教学系统需要拼好：
   - `市场前端地址/sso/callback?ticket=xxx&return_url=教学系统地址`

3. 实现或开启 ticket 签发逻辑
   - ticket 至少要包含：
     - `typ`
     - `jti`
     - `uid`
     - `sub`
     - `role`
     - `school_id`
     - `iss`
     - `aud`
     - `exp`

4. 配置与市场一致的联邦密钥
   - 如果走 HS256，就两边统一 `FEDERATION_SECRET`
   - 如果走 RS256，就教学系统持私钥签发，市场持公钥验签

5. （可选）调用用户同步接口
   - 当教学系统用户首次进入市场前，或用户信息变更后
   - 可调用 `/hall/federation/users/sync` 预同步用户

#### 市场侧需要做的事

1. 把该学校加入受信任发行方
   - 即 `FEDERATION_TRUSTED_ISSUERS` 中要包含该学校对应的 `iss`

2. 确保市场侧接受该学校的 `aud` / `school_id`

3. 确保 Redis、防重放、时间同步正常

4. 确保前端 `.env` 中的教学系统返回地址配置合理

#### 推荐对接检查顺序

给新学校做对接时，建议按下面顺序检查：

1. 教学系统能否正确生成 ticket
2. ticket 中 `iss` / `aud` / `school_id` 是否符合市场要求
3. 市场 `/hall/federation/sso/exchange` 是否能成功消费
4. 首次登录后 `/api/v1/auth/me` 是否能识别 hall 用户
5. 该用户是否能正常浏览任务、进入“我的任务”
6. 如需用户预同步，再检查 `/hall/federation/users/sync`

#### 对接失败最常见原因

- 学校本地教学系统配置的市场域名写错
- `iss` 没加入 `FEDERATION_TRUSTED_ISSUERS`
- `aud` 不一致
- 两边联邦密钥不一致
- 服务器时间不同步导致 ticket 过期
- ticket 缺少 `school_id` / `jti` / `typ`
- `return_url` 没配对，导致失败后回不去教学系统

### 14.4 联调教学系统 SSO 时要同步的参数

必须和教学系统方确认一致的内容：

- `FEDERATION_SECRET` 或公私钥
- `iss`
- `aud`
- `school_id`
- ticket 有效期
- 回调地址
- 用户同步接口签名规则

### 14.5 如果只是想快速演示

最简单方案：

1. 后端用 SQLite 启动
2. 前端连本地后端
3. 跳过真实教学系统，只测企业账号注册/登录/任务列表
4. 如需后台演示，执行 `seed_rbac.py` 创建 admin 账号

---

## 15. 注意事项 / 容易踩坑的地方

### 15.1 前端 `.env.example` 里的端口与代码默认值有历史不一致

- 示例里曾写过 `8001`
- 代码默认是 `8000`
- 本地调试建议统一使用 `8000`

### 15.2 后端 `.env` 会覆盖系统环境变量

这个很容易坑人。

后端配置代码会读取 `backend/.env`，并写回 `os.environ`。
所以：

- 你在 shell 里 `export DATABASE_URL=...`
- 但 `backend/.env` 里还是旧值
- 最终程序跑的仍然可能是 `.env` 里的旧值

### 15.3 Redis 不可用时会退化为内存防重放

这在本地调试没问题，但正式环境要注意：

- 单实例还能勉强用
- 多实例部署会失效
- 正式环境请务必接 Redis

### 15.4 `/admin` 不是完整后台

当前 `/admin` 更偏展示页和权限壳子，不要误以为已经具备完整管理能力。
如果后续要做真正管理后台，建议把：

- 任务审核
- 用户管理
- 企业管理
- 公告管理
- 审计日志

逐个拆成真实 API + 页面。

### 15.5 自动建表不等于完成初始化

后端启动的 `create_all()` 只负责“表存在”。
并不等于下面这些都准备好了：

- 角色权限
- 管理员账号
- 历史数据修复
- 表注释/字段注释

这些仍要跑脚本。

---

## 16. 接手建议（我离职前最想提前说清楚的）

如果后面是别人接手，我建议优先做下面几件事：

### 第一优先级

1. **把部署流程固化**
   - 补 Dockerfile / docker-compose / systemd / nginx 配置
2. **把环境变量规范化**
   - dev / test / prod 分开
   - 别再让 `.env.example` 和真实默认端口不一致
3. **把 README 作为唯一入口文档维护**
   - 前后端的 README 最好合并或只保留跳转说明

### 第二优先级

4. **补任务发布/审核/交付闭环**
5. **补真正的后台 API**
6. **把联邦 SSO 联调流程写成接口文档**

### 第三优先级

7. **补部署健康检查与日志规范**
8. **补数据库迁移机制**
   - 目前主要靠 `create_all()` + 手工脚本，不适合长期演进
   - 后续建议引入 Alembic

---

## 17. 交接 Checklist

如果你是接手人，建议按下面 checklist 一项项过：

### 环境

- [ ] 本地能启动 backend
- [ ] 本地能启动 frontend
- [ ] `backend/.env` 已确认
- [ ] `frontend/.env` 已确认
- [ ] 数据库连接正常
- [ ] Redis 连接正常（若正式联调）

### 功能

- [ ] `GET /api/v1/health` 返回正常
- [ ] 企业注册/登录正常
- [ ] `/api/v1/tasks` 可返回数据
- [ ] `/api/v1/tasks/{id}/claim` 可调用
- [ ] `/api/v1/tasks/my` 可返回我的任务
- [ ] `/hall/federation/sso/exchange` 联调通过
- [ ] `/hall/federation/users/sync` 联调通过

### 权限/后台

- [ ] RBAC 已初始化
- [ ] 至少有一个 `super_admin`
- [ ] `/admin` 可访问

### 部署

- [ ] 前端构建产物可部署
- [ ] 后端服务有进程守护
- [ ] Nginx 反代路径确认
- [ ] CORS 已收紧
- [ ] 正式密钥已替换

---

## 18. 相关文件索引

接手时最常看的文件：

### 前端

- `frontend/package.json`
- `frontend/.env.example`
- `frontend/src/services/auth.ts`
- `frontend/src/services/tasks.ts`
- `frontend/src/router/index.tsx`
- `frontend/src/views/SsoCallbackView.tsx`
- `frontend/src/views/AdminConsoleView.tsx`

### 后端

- `backend/requirements.txt`
- `backend/.env.example`
- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/core/security.py`
- `backend/app/api/v1/api.py`
- `backend/app/api/v1/endpoints/auth.py`
- `backend/app/api/v1/endpoints/federation.py`
- `backend/app/api/v1/endpoints/tasks.py`
- `backend/app/services/replay_store.py`
- `backend/scripts/seed_rbac.py`

### 设计文档

- `docs/plan/2026-03-11-task-hall-design.md`
- `docs/plans/2026-03-13-task-hall-design-development-plan.md`

---

## 19. 最后一句交接话

如果你只记住三件事，请记这三件：

1. **后端真实配置看 `backend/.env`，不要只看 shell 环境变量**
2. **本地联调先统一 backend=8000 / frontend=3000**
3. **部署后一定要补跑 RBAC 初始化，不然后台和权限链路不完整**

