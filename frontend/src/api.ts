import { storage } from '@/src/utils/storage';

const BASE = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
const API = `${BASE}/api`;
const TOKEN_KEY = 'gs_token';

async function getToken() {
  return await storage.secureGet<string>(TOKEN_KEY, '');
}
export async function setToken(t: string) {
  await storage.secureSet(TOKEN_KEY, t);
}
export async function clearToken() {
  await storage.secureRemove(TOKEN_KEY);
}

async function request(path: string, opts: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && (data.detail || data.message)) || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: async (email: string, password: string) => {
    const data = await request('/auth/login-json', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.access_token) await setToken(data.access_token);
    return data;
  },
  me: () => request('/auth/me'),
  register: (body: { name: string; email: string; password: string; role?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  dashboard: () => request('/dashboard'),
  notifications: () => request('/notifications'),
  search: (q: string) => request(`/search?q=${encodeURIComponent(q)}`),

  clients: (type?: string, q?: string) => {
    const p = new URLSearchParams();
    if (type) p.append('type', type);
    if (q) p.append('q', q);
    const qs = p.toString();
    return request(`/clients${qs ? `?${qs}` : ''}`);
  },
  client: (id: string) => request(`/clients/${id}`),
  createClient: (body: any) => request('/clients', { method: 'POST', body: JSON.stringify(body) }),

  karigars: () => request('/karigars'),
  karigar: (id: string) => request(`/karigars/${id}`),
  createKarigar: (body: any) => request('/karigars', { method: 'POST', body: JSON.stringify(body) }),

  orders: (params: { client_id?: string; status?: string; q?: string } = {}) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p.append(k, String(v)); });
    const qs = p.toString();
    return request(`/orders${qs ? `?${qs}` : ''}`);
  },
  order: (id: string) => request(`/orders/${id}`),
  createOrder: (body: any) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  advanceStage: (id: string, body: any) =>
    request(`/orders/${id}/advance-stage`, { method: 'POST', body: JSON.stringify(body) }),

  goldEntries: (client_id?: string) =>
    request(`/gold-entries${client_id ? `?client_id=${client_id}` : ''}`),
  addGold: (b: any) => request('/gold-entries', { method: 'POST', body: JSON.stringify(b) }),
  silverEntries: (cid?: string) =>
    request(`/silver-entries${cid ? `?client_id=${cid}` : ''}`),
  addSilver: (b: any) => request('/silver-entries', { method: 'POST', body: JSON.stringify(b) }),
  diamondEntries: (cid?: string) =>
    request(`/diamond-entries${cid ? `?client_id=${cid}` : ''}`),
  addDiamond: (b: any) => request('/diamond-entries', { method: 'POST', body: JSON.stringify(b) }),
  gemstoneEntries: (cid?: string) =>
    request(`/gemstone-entries${cid ? `?client_id=${cid}` : ''}`),
  addGemstone: (b: any) => request('/gemstone-entries', { method: 'POST', body: JSON.stringify(b) }),
  cashEntries: (cid?: string) =>
    request(`/cash-entries${cid ? `?client_id=${cid}` : ''}`),
  addCash: (b: any) => request('/cash-entries', { method: 'POST', body: JSON.stringify(b) }),

  invoices: (cid?: string) =>
    request(`/invoices${cid ? `?client_id=${cid}` : ''}`),
  createInvoice: (b: any) => request('/invoices', { method: 'POST', body: JSON.stringify(b) }),

  inventory: () => request('/inventory'),
  addInventory: (b: any) => request('/inventory', { method: 'POST', body: JSON.stringify(b) }),
};
