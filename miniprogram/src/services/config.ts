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

export const DEFAULT_API_BASE_URL = envApiBaseUrl.replace(/\/$/, '');
export const STORAGE_KEY_API_BASE_URL = 'apiBaseUrl';
export const STORAGE_KEY_TOKEN = 'alumni-card-token';
export const STORAGE_KEY_APPOINTMENTS = 'alumni-card-appointments';
