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

  let response: Taro.request.SuccessCallbackResult<{ data: T } | T>;
  try {
    response = await Taro.request<{ data: T } | T>({
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
  } catch (error) {
    const errMsg =
      error && typeof error === 'object' && 'errMsg' in error ? String((error as { errMsg?: string }).errMsg || '') : '';
    const prefix = baseUrl.startsWith('http://') ? '当前使用的是 http 地址，真机环境建议改为 https 或内网穿透地址。' : '';
    throw new Error(`${prefix}${errMsg || '网络请求失败，请检查后端服务是否已启动'}`.trim());
  }

  if (response.statusCode >= 400) {
    throw new Error(getErrorMessage(response.data, response.statusCode));
  }

  const payload = response.data as { data?: T } | T;
  return (payload as { data?: T }).data ?? (payload as T);
}
