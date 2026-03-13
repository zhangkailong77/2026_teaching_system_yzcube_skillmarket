export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: number;
  username: string;
}

export interface FederationExchangeUser {
  id: number;
  school_id: string;
  source_user_id: string;
  username: string;
  role: string;
}

export interface FederationExchangeResult {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: FederationExchangeUser;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://127.0.0.1:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let detail = '请求失败';
    try {
      const data = await response.json();
      detail = data?.detail || detail;
    } catch {
      // ignore json parse failure
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export async function registerEnterprise(username: string, password: string): Promise<AuthUser> {
  return request<AuthUser>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string): Promise<AuthTokens> {
  const data = await request<{ access_token: string; refresh_token: string }>(
    '/api/v1/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
  );
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

export async function getMe(accessToken: string): Promise<AuthUser> {
  return request<AuthUser>('/api/v1/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function exchangeFederationTicket(ticket: string): Promise<FederationExchangeResult> {
  const data = await request<{
    token_type: string;
    access_token: string;
    expires_in: number;
    user: FederationExchangeUser;
  }>('/hall/federation/sso/exchange', {
    method: 'POST',
    body: JSON.stringify({ ticket }),
  });
  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    user: data.user,
  };
}
