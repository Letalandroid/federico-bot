export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('supabase-auth-token'); // Re-using local storage key name for compatibility, though it's our JWT

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed?.access_token) {
        headers['Authorization'] = `Bearer ${parsed.access_token}`;
      }
    } catch (e) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `API Error: ${response.statusText}`);
  }

  return response.json();
};

export const api = {
  get: (endpoint: string) => fetchApi(endpoint),
  post: (endpoint: string, body: any) => fetchApi(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => fetchApi(endpoint, { method: 'DELETE' }),
};
