import Taro from '@tarojs/taro';
import { DEFAULT_API_BASE_URL, STORAGE_KEY_API_BASE_URL, STORAGE_KEY_TOKEN } from './config';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown>;
}

type ErrorPayload = {
  detail?: string;
  message?: string;
  errMsg?: string;
};

function getErrorMessage(payload: unknown, statusCode: number) {
  if (payload && typeof payload === 'object') {
    const errorPayload = payload as ErrorPayload;
    if (typeof errorPayload.detail === 'string' && errorPayload.detail) {
      return errorPayload.detail;
    }
    if (typeof errorPayload.message === 'string' && errorPayload.message) {
      return errorPayload.message;
    }
    if (typeof errorPayload.errMsg === 'string' && errorPayload.errMsg) {
      return errorPayload.errMsg;
    }
  }

  return `请求失败：${statusCode}`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = Taro.getStorageSync<string>(STORAGE_KEY_TOKEN);
  const baseUrl = (Taro.getStorageSync<string>(STORAGE_KEY_API_BASE_URL) || DEFAULT_API_BASE_URL || '').replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('接口基础地址未配置');
  }

  const response = await Taro.request<{ data: T } | T>({
    url: `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
    method: options.method || 'GET',
    data: options.data,
    timeout: 8000,
    header: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (response.statusCode >= 400) {
    throw new Error(getErrorMessage(response.data, response.statusCode));
  }

  const payload = response.data as { data?: T } | T;
  return (payload as { data?: T }).data ?? (payload as T);
}
