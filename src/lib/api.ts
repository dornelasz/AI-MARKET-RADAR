export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T;
}

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export function apiGet<T>(url: string) {
  return request<T>(url);
}

export function apiPost<T>(url: string, body?: unknown) {
  return request<T>(url, {
    method: "POST",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(url: string, body: unknown) {
  return request<T>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiDelete<T>(url: string) {
  return request<T>(url, { method: "DELETE" });
}
