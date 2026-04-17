import { API_BASE_URL } from '../config';
import { getAuthHeaders } from './tokenStore';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  authenticated?: boolean;
}

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, authenticated = false, headers: customHeaders, ...rest } = options;

    const headers: Record<string, string> = {
      ...customHeaders as Record<string, string>,
    };

    if (authenticated) {
      Object.assign(headers, getAuthHeaders());
    }

    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...rest,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response as unknown as T;
  }

  async get<T>(endpoint: string, authenticated = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', authenticated });
  }

  async post<T>(endpoint: string, body?: unknown, authenticated = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, authenticated });
  }

  async put<T>(endpoint: string, body?: unknown, authenticated = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, authenticated });
  }

  async patch<T>(endpoint: string, body?: unknown, authenticated = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, authenticated });
  }

  async delete<T>(endpoint: string, authenticated = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', authenticated });
  }

  async postFormData<T>(endpoint: string, formData: FormData, authenticated = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: formData, authenticated });
  }
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const httpClient = new HttpClient(API_BASE_URL);
