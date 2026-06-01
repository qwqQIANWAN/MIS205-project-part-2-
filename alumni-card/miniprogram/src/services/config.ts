type RuntimeEnv = {
  TARO_APP_API_BASE_URL?: string;
};

type RuntimeGlobal = {
  process?: {
    env?: RuntimeEnv;
  };
};

function readEnvApiBaseUrl() {
  const runtime = globalThis as RuntimeGlobal;
  const env = runtime.process?.env;

  if (typeof env?.TARO_APP_API_BASE_URL === 'string') {
    return env.TARO_APP_API_BASE_URL;
  }

  return '';
}

const envApiBaseUrl = readEnvApiBaseUrl();
const FALLBACK_API_BASE_URL = 'http://129.204.77.119/api/v1';

export const DEFAULT_API_BASE_URL = (envApiBaseUrl || FALLBACK_API_BASE_URL).replace(/\/$/, '');
export const STORAGE_KEY_API_BASE_URL = 'apiBaseUrl';
export const STORAGE_KEY_TOKEN = 'alumni-card-token';
export const STORAGE_KEY_APPOINTMENTS = 'alumni-card-appointments';
export const STORAGE_KEY_PREVIEW_PROFILE = 'alumni-card-preview-profile';
export const PREVIEW_MOCK_TOKEN = 'alumni-card-preview-token';
