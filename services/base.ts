/**
 * 微信小程序请求基类 (TypeScript)
 * 实现双 Token 无感刷新机制
 * 特性：
 * 1. 根据环境自动切换 BASE_URL
 * 2. 支持请求/响应拦截器
 * 3. 统一的错误处理
 * 4. RESTful 快捷方法 (get/post/put/delete)
 * 5. 完善的 TypeScript 类型支持
 */

// ==================== 环境配置 ====================

/**
 * 根据小程序环境自动获取 API 基础地址
 */
const getBaseUrl = (): string => {
  try {
    const { envVersion } = wx.getAccountInfoSync().miniProgram;
    switch (envVersion) {
      case 'develop':
        return 'http://127.0.0.1:8008';
      case 'trial':
        return 'https://staging-api.example.com';
      case 'release':
        return 'https://api.example.com';
      default:
        return 'http://127.0.0.1:8008';
    }
  } catch {
    return 'http://127.0.0.1:8008';
  }
};

const BASE_URL = getBaseUrl();
const TIMEOUT = 80000;

// ==================== Token 管理 ====================

const getAccessToken = (): string => (wx.getStorageSync('accessToken') as string) || '';
const getRefreshToken = (): string => (wx.getStorageSync('refreshToken') as string) || '';
const setTokens = (accessToken: string, refreshToken: string): void => {
  wx.setStorageSync('accessToken', accessToken);
  wx.setStorageSync('refreshToken', refreshToken);
};

// 是否正在刷新的标记
let isRefreshing = false;
// 重试请求队列
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken: string): void => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// ==================== 类型定义 ====================

/**
 * 请求配置接口
 */
interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
  /** 是否显示加载提示 */
  showLoading?: boolean;
  /** 加载提示文字 */
  loadingText?: string;
}

/**
 * 统一的 API 响应结构
 */
interface ApiResult<T = any> {
  code: number;
  data: T;
  message: string;
}

/**
 * 旧版 API 响应接口（兼容现有代码）
 */
interface ApiResponse {
  code?: number;
  data?: any;
  message?: string;
  detail?: {
    code: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * 自定义 API 错误类
 */
class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: any,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ==================== 拦截器 ====================

interface Interceptors {
  request: ((config: RequestOptions) => RequestOptions | Promise<RequestOptions>)[];
  response: ((response: any) => any | Promise<any>)[];
  error: ((error: ApiError) => any | Promise<any>)[];
}

const interceptors: Interceptors = {
  request: [],
  response: [],
  error: []
};

/**
 * 添加请求拦截器
 */
const addRequestInterceptor = (
  onFulfilled: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>
): (() => void) => {
  interceptors.request.push(onFulfilled);
  return () => {
    const index = interceptors.request.indexOf(onFulfilled);
    if (index > -1) interceptors.request.splice(index, 1);
  };
};

/**
 * 添加响应拦截器
 */
const addResponseInterceptor = (
  onFulfilled: (response: any) => any | Promise<any>,
  onRejected?: (error: ApiError) => any | Promise<any>
): (() => void) => {
  interceptors.response.push(onFulfilled);
  if (onRejected) interceptors.error.push(onRejected);
  return () => {
    const index = interceptors.response.indexOf(onFulfilled);
    if (index > -1) interceptors.response.splice(index, 1);
    if (onRejected) {
      const errIndex = interceptors.error.indexOf(onRejected);
      if (errIndex > -1) interceptors.error.splice(errIndex, 1);
    }
  };
};

/**
 * 执行请求拦截器
 */
const runRequestInterceptors = async (config: RequestOptions): Promise<RequestOptions> => {
  let result = config;
  for (const interceptor of interceptors.request) {
    result = await interceptor(result);
  }
  return result;
};

/**
 * 执行响应拦截器
 */
const runResponseInterceptors = async (response: any): Promise<any> => {
  let result = response;
  for (const interceptor of interceptors.response) {
    result = await interceptor(result);
  }
  return result;
};

/**
 * 执行错误拦截器
 */
const runErrorInterceptors = async (error: ApiError): Promise<any> => {
  let result = error;
  for (const interceptor of interceptors.error) {
    try {
      result = await interceptor(result);
    } catch (e) {
      result = e as ApiError;
    }
  }
  throw result;
};

// ==================== 核心请求逻辑 ====================

/**
 * 刷新 Token
 */
const refreshToken = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    wx.removeStorageSync('accessToken');

    wx.request({
      url: `${BASE_URL}/api/users/refresh`,
      method: 'GET',
      header: {
        'token': getRefreshToken(),
        'content-type': 'application/x-www-form-urlencoded'
      },
      timeout: TIMEOUT,
      success: (res) => {
        const data = res.data as any;
        if (data && data.id > 0) {
          setTokens(data.atoken, data.rtoken);
          resolve(data);
        } else {
          reject(new ApiError(401, '刷新 Token 失败', data));
        }
      },
      fail: (err) => {
        reject(new ApiError(-1, '网络请求失败', null, err));
      }
    });
  });
};

/**
 * 处理 401 未授权
 */
const handleUnauthorized = <T = any>(
  _options: RequestOptions,
  _resolve: (value: T) => void,
  reject: (reason?: any) => void
): void => {
  wx.removeStorageSync('accessToken');
  wx.removeStorageSync('refreshToken');

  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none'
  });

  setTimeout(() => {
    wx.navigateTo({ url: '/pages/login/login' });
  }, 1500);

  reject(new ApiError(401, '未授权'));
};

/**
 * 处理 Token 过期
 */
const handleTokenExpired = <T = any>(
  options: RequestOptions,
  resolve: (value: T) => void,
  reject: (reason?: any) => void
): void => {
  wx.removeStorageSync('accessToken');

  if (isRefreshing) {
    return subscribeTokenRefresh(() => {
      requestWithRefresh<T>(options).then(resolve).catch(reject);
    });
  }

  isRefreshing = true;

  refreshToken()
    .then((res) => {
      isRefreshing = false;
      onTokenRefreshed(res.atoken);
      requestWithRefresh<T>(options).then(resolve).catch(reject);
    })
    .catch(() => {
      isRefreshing = false;
      refreshSubscribers = [];
      handleUnauthorized<T>(options, resolve, reject);
    });
};

/**
 * 构建请求头
 */
const buildHeaders = (options: RequestOptions): Record<string, string> => {
  const header: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
    ...options.header
  };

  const accessToken = getAccessToken();
  header['token'] = accessToken || getRefreshToken();

  return header;
};

/**
 * 基础请求封装
 */
const request = <T = any>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    const header = buildHeaders(options);

    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: options.timeout || TIMEOUT,
      success: (res) => {
        resolve(res.data as T);
      },
      fail: (err) => {
        reject(new ApiError(-1, err.errMsg || '请求失败', null, err));
      }
    });
  });
};

/**
 * 带 Token 刷新的请求封装（核心方法）
 */
const requestWithRefresh = <T = any>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    const header = buildHeaders(options);

    // 显示加载提示
    if (options.showLoading) {
      wx.showLoading({ title: options.loadingText || '加载中...', mask: true });
    }

    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: options.timeout || TIMEOUT,
      success: async (res) => {
        if (options.showLoading) wx.hideLoading();

        const { statusCode, data } = res;
        const responseData = data as ApiResponse;

        // 请求成功
        if (statusCode >= 200 && statusCode < 300) {
          try {
            const result = await runResponseInterceptors(responseData);
            resolve(result as T);
          } catch (e) {
            reject(e);
          }
          return;
        }

        // 401 未授权
        if (statusCode === 401) {
          handleUnauthorized(options, resolve, reject);
          return;
        }

        // 5000 业务错误码（Token 过期）
        if (responseData.detail?.code === 5000 && !options.url.includes('/refresh')) {
          handleTokenExpired(options, resolve, reject);
          return;
        }

        // 其他错误
        const error = new ApiError(
          responseData.code || statusCode,
          responseData.message || '请求失败',
          responseData
        );
        reject(error);
      },
      fail: (err) => {
        if (options.showLoading) wx.hideLoading();

        if (err.errMsg?.includes('request:fail')) {
          wx.showToast({ title: '网络请求失败', icon: 'none' });
        }

        reject(new ApiError(-1, err.errMsg || '网络请求失败', null, err));
      }
    });
  });
};

/**
 * 执行请求（带拦截器支持）
 */
const executeRequest = async <T = any>(options: RequestOptions): Promise<T> => {
  try {
    // 执行请求拦截器
    const config = await runRequestInterceptors(options);
    // 执行请求
    const response = await requestWithRefresh<T>(config);
    return response;
  } catch (error) {
    // 执行错误拦截器
    if (error instanceof ApiError) {
      await runErrorInterceptors(error);
    }
    throw error;
  }
};

// ==================== RESTful 快捷方法 ====================

/**
 * GET 请求
 */
const get = <T = any>(url: string, params?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>): Promise<T> => {
  return executeRequest<T>({ url, method: 'GET', data: params, ...options });
};

/**
 * POST 请求
 */
const post = <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>): Promise<T> => {
  return executeRequest<T>({ url, method: 'POST', data, ...options });
};

/**
 * PUT 请求
 */
const put = <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>): Promise<T> => {
  return executeRequest<T>({ url, method: 'PUT', data, ...options });
};

/**
 * DELETE 请求
 */
const del = <T = any>(url: string, params?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>): Promise<T> => {
  return executeRequest<T>({ url, method: 'DELETE', data: params, ...options });
};

// ==================== 默认拦截器配置 ====================

// 添加默认的请求拦截器：自动添加 userId（如果本地存储中有）
addRequestInterceptor((config) => {
  const userInfo = wx.getStorageSync('userInfo');
  if (userInfo?.userId && config.data && typeof config.data === 'object') {
    // 如果是 GET 请求，userId 加到 URL 参数；POST/PUT 加到 body
    if (config.method === 'GET') {
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}user_id=${userInfo.userId}`;
    } else {
      config.data = { ...config.data, user_id: userInfo.userId };
    }
  }
  return config;
});

// ==================== 导出 ====================

export default {
  // RESTful 快捷方法（推荐使用）
  get,
  post,
  put,
  delete: del,

  // 底层请求方法
  request,
  requestWithRefresh,
  executeRequest,

  // 拦截器
  interceptors: {
    request: addRequestInterceptor,
    response: addResponseInterceptor
  },

  // Token 管理
  refreshToken,
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens: (): void => {
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('refreshToken');
  },
  isLoggedIn: (): boolean => !!getRefreshToken(),

  // 工具
  getBaseUrl: () => BASE_URL
};

export {
  RequestOptions,
  ApiResult,
  ApiResponse,
  ApiError
};
