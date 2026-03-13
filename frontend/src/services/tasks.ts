export interface TaskListItem {
  id: number;
  title: string;
  category: string;
  description: string;
  bounty_points: number;
  required_score: number;
  deadline_at: string;
  status: string;
  enterprise_name: string;
  tags_json?: unknown;
  attachments_json?: unknown;
  created_at: string;
}

export interface TaskListResponse {
  items: TaskListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface TaskListQuery {
  q?: string;
  category?: string;
  bounty_min?: number;
  bounty_max?: number;
  min_score?: number;
  deadline_days?: number;
  sort?: 'latest' | 'bounty_desc' | 'deadline_asc';
  page?: number;
  page_size?: number;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://127.0.0.1:8000';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
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

function toQueryString(params: Record<string, string>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '') {
      usp.set(key, value);
    }
  });
  const query = usp.toString();
  return query ? `?${query}` : '';
}

export async function fetchTasks(query: TaskListQuery): Promise<TaskListResponse> {
  const queryString = toQueryString({
    q: query.q?.trim() || '',
    category: query.category || '',
    bounty_min: query.bounty_min !== undefined ? String(query.bounty_min) : '',
    bounty_max: query.bounty_max !== undefined ? String(query.bounty_max) : '',
    min_score: query.min_score !== undefined ? String(query.min_score) : '',
    deadline_days: query.deadline_days !== undefined ? String(query.deadline_days) : '',
    sort: query.sort || 'latest',
    page: String(query.page || 1),
    page_size: String(query.page_size || 30),
  });
  return request<TaskListResponse>(`/api/v1/tasks${queryString}`);
}
