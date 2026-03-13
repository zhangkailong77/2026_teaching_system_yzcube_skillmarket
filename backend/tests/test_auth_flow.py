import os
from uuid import uuid4

from fastapi.testclient import TestClient

os.environ['DATABASE_URL'] = 'sqlite+pysqlite:///:memory:'
os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'] = '30'
os.environ['REFRESH_TOKEN_EXPIRE_DAYS'] = '7'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
os.environ['JWT_ALGORITHM'] = 'HS256'

from app.main import app  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402

Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_register_login_refresh_and_me_flow() -> None:
    username = f"user_{uuid4().hex[:8]}"
    password = 'Passw0rd!'

    register_resp = client.post('/api/v1/auth/register', json={'username': username, 'password': password})
    assert register_resp.status_code == 201
    register_data = register_resp.json()
    assert register_data['username'] == username

    duplicate_resp = client.post('/api/v1/auth/register', json={'username': username, 'password': password})
    assert duplicate_resp.status_code == 409

    login_resp = client.post('/api/v1/auth/login', json={'username': username, 'password': password})
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data['token_type'] == 'bearer'
    assert login_data['access_token']
    assert login_data['refresh_token']

    me_resp = client.get('/api/v1/auth/me', headers={'Authorization': f"Bearer {login_data['access_token']}"})
    assert me_resp.status_code == 200
    assert me_resp.json()['username'] == username

    refresh_resp = client.post('/api/v1/auth/refresh', json={'refresh_token': login_data['refresh_token']})
    assert refresh_resp.status_code == 200
    refresh_data = refresh_resp.json()
    assert refresh_data['access_token']
    assert refresh_data['refresh_token']
    assert refresh_data['refresh_token'] != login_data['refresh_token']
