# FastAPI Auth + MySQL Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `yzcube_skillmarket` MySQL 数据库上实现 FastAPI 登录注册（含 access + refresh token）。

**Architecture:** 使用 SQLAlchemy 会话层连接 MySQL，`models/schemas/services` 分层；`/api/v1/auth` 提供注册、登录、刷新、当前用户接口；refresh token 入库并轮转撤销，access token 用 JWT 做无状态鉴权。

**Tech Stack:** FastAPI, SQLAlchemy, PyMySQL, Passlib[bcrypt], python-jose, Pytest

---

### Task 1: Add failing tests first (TDD Red)

**Files:**
- Create: `backend/tests/test_auth_flow.py`

**Step 1: Write failing test for register/login/refresh/me**
- 场景：注册成功、重复注册失败、登录成功、刷新成功、`/me` 可读取用户。

**Step 2: Run tests to verify they fail**
- Run: `cd backend && pytest -q`
- Expected: FAIL (missing auth router / missing modules)

### Task 2: Add DB and security layers

**Files:**
- Create: `backend/app/db/base.py`
- Create: `backend/app/db/session.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/refresh_token.py`
- Create: `backend/app/core/security.py`
- Modify: `backend/app/core/config.py`

**Step 1: Add SQLAlchemy engine/session and models**
**Step 2: Add password hash + JWT helpers**

### Task 3: Add auth schemas/services/endpoints

**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/api/v1/endpoints/auth.py`
- Modify: `backend/app/api/v1/api.py`
- Modify: `backend/app/main.py`

**Step 1: Implement register/login/refresh/me handlers**
**Step 2: Mount routes under `/api/v1/auth`**

### Task 4: Create database and tables

**Files:**
- N/A (remote DB operation)

**Step 1: Create MySQL database `yzcube_skillmarket` on `112.124.32.196:13306`**
**Step 2: Initialize schema with SQLAlchemy `create_all`**

### Task 5: Verify

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/README.md`

**Step 1: Run tests**
- Run: `cd backend && pytest -q`
- Expected: PASS

**Step 2: Run syntax/build checks**
- Run: `PYTHONPYCACHEPREFIX=/tmp/python-pycache python3 -m compileall backend`
- Expected: exit 0
