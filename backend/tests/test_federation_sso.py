import hashlib
import hmac
import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient
from jose import jwt

os.environ['DATABASE_URL'] = 'sqlite+pysqlite:///:memory:'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
os.environ['JWT_ALGORITHM'] = 'HS256'
os.environ['SESSION_SECRET'] = 'test-session-secret'
os.environ['FEDERATION_SECRET'] = 'test-federation-secret'
os.environ['FEDERATION_EXPECTED_AUD'] = 'yzcube-skillmarket'
os.environ['FEDERATION_TRUSTED_ISSUERS'] = 'teaching-yzcube-school'

from app.main import app  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)
settings = get_settings()


def _build_ticket(jti: str) -> str:
    return jwt.encode(
        {
            'typ': 'federation_sso_ticket',
            'jti': jti,
            'uid': 'student-1001',
            'sub': 'zhangsan',
            'role': 'student',
            'school_id': 'yzcube-school',
            'iss': settings.federation_trusted_issuers[0],
            'aud': settings.federation_expected_aud,
            'exp': datetime.now(UTC) + timedelta(seconds=60),
        },
        settings.federation_secret,
        algorithm='HS256',
    )


def test_exchange_ticket_success_and_replay_rejected() -> None:
    ticket = _build_ticket(uuid4().hex)

    first = client.post('/hall/federation/sso/exchange', json={'ticket': ticket})
    assert first.status_code == 200
    first_data = first.json()
    assert first_data['access_token']
    assert first_data['user']['school_id'] == 'yzcube-school'
    assert first_data['user']['source_user_id'] == 'student-1001'

    replay = client.post('/hall/federation/sso/exchange', json={'ticket': ticket})
    assert replay.status_code == 409
    assert replay.json()['detail'] == 'ticket already used'

    me = client.get('/api/v1/auth/me', headers={'Authorization': f"Bearer {first_data['access_token']}"})
    assert me.status_code == 200
    assert me.json()['username'] == 'zhangsan'


def test_sync_user_then_password_login() -> None:
    username = f"student_{uuid4().hex[:8]}"
    password = 'Passw0rd!2026'
    ts = int(datetime.now(UTC).timestamp())
    nonce = uuid4().hex
    sign_source = '|'.join(
        [
            settings.federation_trusted_issuers[0],
            'uid-2001',
            username,
            'student',
            '',
            password,
            str(ts),
            nonce,
        ]
    )
    sign = hmac.new(
        settings.federation_secret.encode('utf-8'),
        sign_source.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()

    sync = client.post(
        '/hall/federation/users/sync',
        json={
            'school_id': settings.federation_trusted_issuers[0],
            'uid': 'uid-2001',
            'username': username,
            'role': 'student',
            'password': password,
            'ts': ts,
            'nonce': nonce,
            'sign': sign,
        },
    )
    assert sync.status_code == 200

    login = client.post('/api/v1/auth/login', json={'username': username, 'password': password})
    assert login.status_code == 200
    assert login.json()['access_token']
