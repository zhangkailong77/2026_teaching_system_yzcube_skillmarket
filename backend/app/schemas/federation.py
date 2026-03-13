from pydantic import BaseModel


class FederationExchangeRequest(BaseModel):
    ticket: str


class FederationUserPublic(BaseModel):
    id: int
    school_id: str
    source_user_id: str
    username: str
    role: str


class FederationExchangeResponse(BaseModel):
    token_type: str = 'bearer'
    access_token: str
    expires_in: int
    user: FederationUserPublic


class FederationUserSyncRequest(BaseModel):
    school_id: str
    uid: str
    username: str
    role: str = 'student'
    password_hash: str | None = None
    password: str | None = None
    ts: int
    nonce: str
    sign: str


class FederationUserSyncResponse(BaseModel):
    ok: bool = True
    user: FederationUserPublic
