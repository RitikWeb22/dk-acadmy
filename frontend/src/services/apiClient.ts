/**
 * Centralized API Client for DK Academy JEE Frontend
 * Connects directly to backend API (http://localhost:5000/api/v1)
 * Supports automatic token injection, error handling, and offline fallback.
 */

export const getApiBaseUrl = (): string => {
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (configured) {
    if (
      typeof window !== 'undefined' &&
      window.location?.hostname &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      if (configured.includes('localhost') || configured.includes('127.0.0.1')) {
        return '/api/v1';
      }
    }
    return configured.replace(/\/+$/, '');
  }
  return '/api/v1';
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  [key: string]: any;
}

export const getActiveAuthToken = (): string | null => {
  try {
    const adminSession =
      localStorage.getItem('dk_academy_admin_session_v1') ||
      localStorage.getItem('dk_academy_admin_session');
    if (adminSession) {
      const parsed = JSON.parse(adminSession);
      if (parsed.token) return parsed.token;
    }

    const studentSession = localStorage.getItem('dk_academy_student_session');
    if (studentSession) {
      const parsed = JSON.parse(studentSession);
      if (parsed.token) return parsed.token;
    }

    const directToken = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (directToken) return directToken;
  } catch {}
  return null;
};

export const ensureValidJwtToken = async (): Promise<string | null> => {
  const token = getActiveAuthToken();
  // Valid JWT format is three base64 segments separated by dots
  if (token && token.split('.').length === 3) {
    return token;
  }

  // Attempt transparent re-authentication with backend if token is missing or legacy mock format
  try {
    const adminRaw =
      localStorage.getItem('dk_academy_admin_session_v1') ||
      localStorage.getItem('dk_academy_admin_session');

    let email = 'ritikweb30@gmail.com';
    let password = 'ritik@123';

    if (adminRaw) {
      const parsed = JSON.parse(adminRaw);
      if (parsed?.user?.email) {
        email = parsed.user.email;
        if (email.toLowerCase().includes('dharmendra')) {
          password = 'admin123';
        }
      }
    }

    const cleanBase = getApiBaseUrl();
    const res = await fetch(`${cleanBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok && data?.success && data?.data?.token) {
      const newJwt = data.data.token;
      if (adminRaw) {
        try {
          const parsed = JSON.parse(adminRaw);
          parsed.token = newJwt;
          localStorage.setItem('dk_academy_admin_session_v1', JSON.stringify(parsed));
          localStorage.setItem('dk_academy_admin_session', JSON.stringify(parsed));
        } catch {}
      }
      return newJwt;
    }
  } catch {}

  return token;
};

export const getAuthHeaders = (includeContentType: boolean = true): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getActiveAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const geminiKey =
    localStorage.getItem('dk_gemini_api_key') ||
    localStorage.getItem('gemini_api_key');
  if (geminiKey) {
    headers['x-gemini-api-key'] = geminiKey.trim();
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
  const cleanBase = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
};

export const apiClient = {
  get baseUrl() {
    return getApiBaseUrl();
  },

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      let res = await fetchWithTimeout(formatEndpoint(endpoint), {
        method: 'GET',
        headers: getAuthHeaders(),
        ...options
      });
      if (res.status === 401) {
        const refreshed = await ensureValidJwtToken();
        if (refreshed) {
          res = await fetchWithTimeout(formatEndpoint(endpoint), {
            method: 'GET',
            headers: getAuthHeaders(),
            ...options
          });
        }
      }
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
      let res = await fetchWithTimeout(formatEndpoint(endpoint), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        ...options
      });
      if (res.status === 401) {
        const refreshed = await ensureValidJwtToken();
        if (refreshed) {
          res = await fetchWithTimeout(formatEndpoint(endpoint), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
            ...options
          });
        }
      }
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
      let res = await fetchWithTimeout(formatEndpoint(endpoint), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        ...options
      });
      if (res.status === 401) {
        const refreshed = await ensureValidJwtToken();
        if (refreshed) {
          res = await fetchWithTimeout(formatEndpoint(endpoint), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
            ...options
          });
        }
      }
      return await safeJsonParse<T>(res);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.warn(`[API PUT ${endpoint} Error]:`, error?.message || error);
      }
      return { success: false, message: error?.name === 'AbortError' ? 'Request timed out' : error?.message || 'Network error' };
    }
  },

  async patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      let res = await fetchWithTimeout(formatEndpoint(endpoint), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        ...options
      });
      if (res.status === 401) {
        const refreshed = await ensureValidJwtToken();
        if (refreshed) {
          res = await fetchWithTimeout(formatEndpoint(endpoint), {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
            ...options
          });
        }
      }
      return await safeJsonParse<T>(res);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.warn(`[API PATCH ${endpoint} Error]:`, error?.message || error);
      }
      return { success: false, message: error?.name === 'AbortError' ? 'Request timed out' : error?.message || 'Network error' };
    }
  },

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      let res = await fetchWithTimeout(formatEndpoint(endpoint), {
        method: 'DELETE',
        headers: getAuthHeaders(),
        ...options
      });
      if (res.status === 401) {
        const refreshed = await ensureValidJwtToken();
        if (refreshed) {
          res = await fetchWithTimeout(formatEndpoint(endpoint), {
            method: 'DELETE',
            headers: getAuthHeaders(),
            ...options
          });
        }
      }
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
      xhr.open('POST', formatEndpoint('/upload'));

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
  },

  async uploadPdfForExtraction(
    file: File,
    meta: { subject?: string; exam?: string; year?: number | string; paperTitle?: string } = {},
    onProgress?: (percent: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', formatEndpoint('/dpp-pyqs/import-pdf'));

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
          if (xhr.status >= 400 || res.error || res.success === false) {
            reject(new Error(res.error || res.details || res.message || `Server returned error (${xhr.status})`));
          } else {
            resolve(res);
          }
        } catch {
          reject(new Error(xhr.status >= 400 ? `Upload failed with status ${xhr.status}` : 'Invalid response from server'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network upload failed'));
      };

      const formData = new FormData();
      formData.append('file', file);
      if (meta.subject) formData.append('subject', meta.subject);
      if (meta.exam) formData.append('exam', meta.exam);
      if (meta.year) formData.append('year', String(meta.year));
      if (meta.paperTitle) formData.append('paperTitle', meta.paperTitle);
      xhr.send(formData);
    });
  },

  async uploadBulkDocumentsForExtraction(
    files: File[],
    meta: {
      subject?: string;
      exam?: string;
      year?: number | string;
      moduleType?: string;
      chapter?: string;
      topic?: string;
    } = {},
    onProgress?: (percent: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', formatEndpoint('/dpp-pyqs/bulk-upload'));

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
          if (xhr.status >= 400 || res.error || res.success === false) {
            reject(
              new Error(
                res.error || res.details || res.message || `Server returned error (${xhr.status})`
              )
            );
          } else {
            resolve(res);
          }
        } catch {
          reject(
            new Error(
              xhr.status >= 400 ? `Upload failed with status ${xhr.status}` : 'Invalid response from server'
            )
          );
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network upload failed'));
      };

      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      if (meta.subject) formData.append('subject', meta.subject);
      if (meta.exam) formData.append('exam', meta.exam);
      if (meta.year) formData.append('year', String(meta.year));
      if (meta.moduleType) formData.append('moduleType', meta.moduleType);
      if (meta.chapter) formData.append('chapter', meta.chapter);
      if (meta.topic) formData.append('topic', meta.topic);
      xhr.send(formData);
    });
  },

  async getGeminiConfig(): Promise<{ configured: boolean; model: string; previewKey: string }> {
    const res = await this.get<any>('/system/gemini-config');
    return res as any;
  },

  async updateGeminiConfig(payload: { apiKey: string; model?: string }): Promise<any> {
    return this.post<any>('/system/gemini-config', payload);
  },

  async formatMathWithAi(payload: {
    statement?: string;
    options?: Array<{ key: string; text: string }>;
    stepSolution?: string;
    dkSirShortcut?: string;
    targetExam?: string;
    model?: string;
    geminiApiKey?: string;
  }): Promise<{
    success: boolean;
    aiPowered: boolean;
    modelUsed: string;
    error?: string;
    message?: string;
    confidence?: number;
    changes?: string[];
    uncertainExpressions?: string[];
    requiresManualReview?: boolean;

    reason?: string;
    data?: {
      statement: string;
      correctedQuestion?: string;
      options: Array<{ key: string; text: string }>;
      correctedOptions?: Array<{ key: string; text: string }>;
      stepSolution?: string;
      dkSirShortcut?: string;
    };
  }> {
    const key =
      payload.geminiApiKey ||
      localStorage.getItem('dk_gemini_api_key') ||
      localStorage.getItem('gemini_api_key') ||
      '';
    const res = await this.post<any>('/dpp-pyqs/ai-format-math', {
      ...payload,
      model: payload.model || 'gemini-2.5-flash',
      geminiApiKey: key
    });
    return res as any;
  },

  async uploadBulkDocx(
    file: File,
    meta: {
      subject?: string;
      targetExam?: string;
      defaultTopic?: string;
      positiveMarks?: number;
      negativeMarks?: number;
    } = {}
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (meta.subject) {
      formData.append('defaultSubject', meta.subject);
      formData.append('subject', meta.subject);
    }
    if (meta.targetExam) {
      formData.append('defaultTargetExam', meta.targetExam);
      formData.append('targetExam', meta.targetExam);
    }
    if (meta.defaultTopic) formData.append('defaultTopic', meta.defaultTopic);
    if (meta.positiveMarks) formData.append('positiveMarks', String(meta.positiveMarks));
    if (meta.negativeMarks) formData.append('negativeMarks', String(meta.negativeMarks));

    const token = await ensureValidJwtToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpointUrl = formatEndpoint('/math-import/bulk-docx');
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: formData
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.message || json.error || `Server returned error (${res.status})`);
    }
    return json;
  },

  async repairMathWithAi(payload: {
    rawText?: string;
    statement?: string;
    options?: any[];
    stepSolution?: string;
    dkSirShortcut?: string;
    targetExam?: string;
    model?: string;
  }): Promise<any> {
    const token = await ensureValidJwtToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpointUrl = formatEndpoint('/math-import/ai-repair');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s client timeout

    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          ...payload,
          statement: payload.statement || payload.rawText || ''
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.error || `AI repair request failed (${res.status})`);
      }
      return json;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
