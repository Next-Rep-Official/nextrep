import { API_BASE_URL } from '../config';
import { getToken, clearToken } from './auth';

export interface ApiError {
  status: number;
  message: string;
}

export interface ApiResponse<T = any> {
  status: number;
  body: {
    message: string;
    data?: T;
  };
}

interface RequestOptions {
  method?: string;
  body?: BodyInit;
  headers?: Record<string, string>;
}

export async function request<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${API_BASE_URL}${normalizedPath}`;

  const headers: Record<string, string> = { ...options.headers };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Add user_id: -1 to query params for GET requests when not logged in
    if ((!options.method || options.method === 'GET') && !normalizedPath.includes('user_id=')) {
      const separator = normalizedPath.includes('?') ? '&' : '?';
      url = `${API_BASE_URL}${normalizedPath}${separator}user_id=-1`;
    }
  }

  // For FormData, don't set Content-Type - browser will set it with boundary
  // Also add user_id: -1 if not logged in
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
    if (!token) {
      options.body.append('user_id', '-1');
    }
  } else if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
    // Add user_id: -1 to JSON body if not logged in
    if (!token && typeof options.body === 'string') {
      try {
        const bodyObj = JSON.parse(options.body);
        bodyObj.user_id = -1;
        options.body = JSON.stringify(bodyObj);
      } catch (e) {
        // If parsing fails, keep original body
      }
    }
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body,
      credentials: 'omit',
    });

    let body: any;
    try {
      const text = await response.text();
      // Check if response is empty
      if (!text || text.trim().length === 0) {
        // Some endpoints might return empty body on success (like DELETE)
        if (response.ok && response.status === 200) {
          body = { message: 'Success' };
        } else {
          // eslint-disable-next-line no-throw-literal
          const error: ApiError = {
            status: response.status,
            message: 'Empty response from server',
          };
          throw error;
        }
      } else {
        // Try to parse as JSON
        try {
          body = JSON.parse(text);
        } catch (jsonError) {
          // Response is not valid JSON
          // eslint-disable-next-line no-throw-literal
          const error: ApiError = {
            status: response.status,
            message: `Invalid response format: Server returned non-JSON data. Status: ${response.status}`,
          };
          throw error;
        }
      }
    } catch (parseError) {
      // If it's already an ApiError, re-throw it
      if (parseError && typeof parseError === 'object' && 'status' in parseError) {
        const apiError: ApiError = parseError as ApiError;
        throw apiError;
      }
      // Otherwise, it's a parsing error
      // eslint-disable-next-line no-throw-literal
      const error: ApiError = {
        status: response.status || 500,
        message: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      };
      throw error;
    }

    if (!response.ok) {
      // Check for expired token (401 Unauthorized)
      if (response.status === 401) {
        clearToken();
        // Redirect to login by dispatching a custom event
        window.dispatchEvent(new CustomEvent('token-expired'));
      }
      // eslint-disable-next-line no-throw-literal
      const error: ApiError = {
        status: response.status,
        message: body?.message || response.statusText || 'Request failed',
      };
      throw error;
    }

    return {
      status: response.status,
      body,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      // eslint-disable-next-line no-throw-literal
      const apiError: ApiError = error as ApiError;
      throw apiError;
    }
    // eslint-disable-next-line no-throw-literal
    const networkError: ApiError = {
      status: 0,
      message: 'Network error',
    };
    throw networkError;
  }
}
