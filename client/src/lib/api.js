const PREVIEW_BASE = '__PORT_5000__';
const ENV_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const API_BASE = ENV_BASE || (PREVIEW_BASE.startsWith('__') ? '' : PREVIEW_BASE);
const CROSS_ORIGIN = Boolean(ENV_BASE);

let bearerToken = null;

export function setBearerToken(token) {
  bearerToken = typeof token === 'string' && token.length > 20 ? token : null;
}

export function clearBearerToken() {
  bearerToken = null;
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildHeaders(extra = {}, isForm = false) {
  const headers = { 'X-Sovx-Client': 'web', Accept: 'application/json', ...extra };
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
  return headers;
}

export async function apiRequest(method, path, body, { signal, raw = false } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders({}, isForm || body === undefined),
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      credentials: CROSS_ORIGIN ? 'include' : 'same-origin',
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Network error. Please check your connection and try again.', 0);
  }

  if (raw) {
    if (!response.ok) throw new ApiError(`Request failed (${response.status}).`, response.status);
    return response;
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!response.ok || (data && data.success === false)) {
    throw new ApiError(data?.message || `Request failed (${response.status}).`, response.status, data?.details);
  }
  return data;
}

export const api = {
  get: (path, opts) => apiRequest('GET', path, undefined, opts),
  post: (path, body, opts) => apiRequest('POST', path, body ?? {}, opts),
  put: (path, body, opts) => apiRequest('PUT', path, body ?? {}, opts),
  patch: (path, body, opts) => apiRequest('PATCH', path, body ?? {}, opts),
  del: (path, opts) => apiRequest('DELETE', path, undefined, opts),
};

export function resolveImage(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  if (url.startsWith('/products/')) return `.${url}`;
  return url;
}

export async function fetchProtectedImage(path, signal) {
  const res = await apiRequest('GET', path, undefined, { raw: true, signal });
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
