# Backend (FastAPI)

## Structure

- `app/main.py`: FastAPI entrypoint
- `app/core/config.py`: runtime settings
- `app/api/v1/api.py`: v1 router aggregator
- `app/api/v1/endpoints/`: API endpoint modules
- `tests/`: backend test modules

## Setup (Conda Python 3.12)

```bash
conda create -y -n yzsm-py312 python=3.12
conda run --no-capture-output -n yzsm-py312 python -m pip install -r backend/requirements.txt
```

## Run

```bash
cd backend
conda run --no-capture-output -n yzsm-py312 uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Test

```bash
conda run --no-capture-output -n yzsm-py312 pytest -q
```

## Auth APIs

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

## Federation SSO API

- `POST /hall/federation/sso/exchange`
  - request: `{ "ticket": "<jwt>" }`
  - validates: signature, `exp`, `typ`, `iss`, `aud`, `school_id`
  - replay protection: `jti` (`REDIS_URL`, fallback to in-memory store)
- `POST /hall/federation/users/sync`
  - request: `school_id, uid, username, role, password_hash/password, ts, nonce, sign`
  - validates: HMAC signature + timestamp window + nonce replay

## Database

- Host: `112.124.32.196`
- Port: `13306`
- DB: `yzcube_skillmarket`
- Tables initialized: `users`, `refresh_tokens`
```
