/**
 * Centralized API Client for DK Academy JEE Frontend
 * Connects directly to backend API (http://localhost:5000/api/v1)
 * Supports automatic token injection, error handling, and offline fallback.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  [key: string]: any;
}

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  try {
    const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

    if (isAdminRoute) {
      // Prioritize admin session on admin portal
      const adminSession =
        localStorage.getItem('dk_academy_admin_session_v1') ||
        localStorage.getItem('dk_academy_admin_session');
      if (adminSession) {
        const parsed = JSON.parse(adminSession);
        if (parsed.token) {
          headers['Authorization'] = `Bearer ${parsed.token}`;
          return headers;
        }
      }
    }

    // Check student session
    const studentSession = localStorage.getItem('dk_academy_student_session');
    if (studentSession) {
      const parsed = JSON.parse(studentSession);
      if (parsed.token) {
        headers['Authorization'] = `Bearer ${parsed.token}`;
        return headers;
      }
    }

    // Fallback to admin session if not already checked
    if (!isAdminRoute) {
      const adminSession =
        localStorage.getItem('dk_academy_admin_session_v1') ||
        localStorage.getItem('dk_academy_admin_session');
      if (adminSession) {
        const parsed = JSON.parse(adminSession);
        if (parsed.token) {
          headers['Authorization'] = `Bearer ${parsed.token}`;
          return headers;
        }
      }
    }
  } catch {
    // ignore json parse error
  }


  return headers;
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 20000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal
    ? (options.signal as any).aborted
      ? options.signal
      : undefined
    : controller.signal;

  try {
    const res = await fetch(url, {
      ...options,
      signal: signal || controller.signal
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
};

const safeJsonParse = async <T = any>(res: Response): Promise<ApiResponse<T>> => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return { success: false, message: 'Failed to parse JSON response' };
    }
  }
  const text = await res.text();
  return {
    success: res.ok,
    message: res.ok ? 'Success' : text || `Server returned status ${res.status}`
  };
};

const formatEndpoint = (endpoint: string): string => {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
};

export const apiClient = {
  baseUrl: API_BASE_URL,

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const res = await fetchWithTimeout(formatEndpoint(endpoint), {
        method: 'GET',
        headers: getAuthHeaders(),
        ...options
      });
      return await safeJsonParse<T>(res);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.warn(`[API GET ${endpoint} Error]:`, error?.message || error);
      }
      return { success: false, message: error?.name === 'AbortError' ? 'Request timed out' : error?.message || 'Network error' };
    }
  },

  async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const res = await fetchWithTimeout(formatEndpoint(endpoint), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        ...options
      });
      return await safeJsonParse<T>(res);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.warn(`[API POST ${endpoint} Error]:`, error?.message || error);
      }
      return { success: false, message: error?.name === 'AbortError' ? 'Request timed out' : error?.message || 'Network error' };
    }
  },

  async put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const res = await fetchWithTimeout(formatEndpoint(endpoint), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        ...options
      });
      return await safeJsonParse<T>(res);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.warn(`[API PUT ${endpoint} Error]:`, error?.message || error);
      }
      return { success: false, message: error?.name === 'AbortError' ? 'Request timed out' : error?.message || 'Network error' };
    }
  },

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const res = await fetchWithTimeout(formatEndpoint(endpoint), {
        method: 'DELETE',
        headers: getAuthHeaders(),
        ...options
      });
      return await safeJsonParse<T>(res);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.warn(`[API DELETE ${endpoint} Error]:`, error?.message || error);
      }
      return { success: false, message: error?.name === 'AbortError' ? 'Request timed out' : error?.message || 'Network error' };
    }
  },

  async uploadMedia(fileData: string, folder: string = 'dk-academy'): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
      const res = await this.post('/upload', { file: fileData, folder });
      return res;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.warn('[API uploadMedia Error]:', error?.message || error);
      }
      return { success: false, message: error?.message || 'Upload failed' };
    }
  },

  async uploadFile(
    file: File,
    folder: string = 'dk-academy',
    onProgress?: (percent: number) => void
  ): Promise<{
    success: boolean;
    url?: string;
    message?: string;
    resourceType?: 'image' | 'video' | 'raw';
    format?: string;
    bytes?: number;
    originalName?: string;
    storage?: string;
  }> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/upload`);

      const headers = getAuthHeaders();
      if (headers.Authorization) {
        xhr.setRequestHeader('Authorization', headers.Authorization);
      }

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch {
          resolve({ success: false, message: 'Invalid response from server' });
        }
      };

      xhr.onerror = () => {
        // Fallback: convert file to base64 and try JSON upload
        try {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result as string;
            const fallbackRes = await apiClient.uploadMedia(base64, folder);
            resolve(fallbackRes as any);
          };
          reader.readAsDataURL(file);
        } catch (fbErr: any) {
          resolve({ success: false, message: fbErr.message || 'Network upload failed' });
        }
      };

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      xhr.send(formData);
    });
  }
};
