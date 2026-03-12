# Backend (FastAPI)

## Structure

- `app/main.py`: FastAPI entrypoint
- `app/core/config.py`: runtime settings
- `app/api/v1/api.py`: v1 router aggregator
- `app/api/v1/endpoints/`: API endpoint modules
- `tests/`: backend test modules

## Setup (Conda Python 3.12)

```bash
conda create -y -n yzcube-backend-py312 python=3.12
conda run --no-capture-output -n yzcube-backend-py312 python -m pip install -r backend/requirements.txt
```

## Run

```bash
cd backend
conda run --no-capture-output -n yzcube-backend-py312 uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Test

```bash
conda run --no-capture-output -n yzcube-backend-py312 pytest -q
```

## Auth APIs

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

## Database

- Host: `112.124.32.196`
- Port: `13306`
- DB: `yzcube_skillmarket`
- Tables initialized: `users`, `refresh_tokens`
```
