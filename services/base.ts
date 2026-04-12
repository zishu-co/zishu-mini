/**
 * 微信小程序请求基类 (TypeScript)
 * 实现双 Token 无感刷新机制
 */

// 获取存储的 token
const getAccessToken = (): string => (wx.getStorageSync('accessToken') as string) || '';
const getRefreshToken = (): string => (wx.getStorageSync('refreshToken') as string) || '';
const setTokens = (accessToken: string, refreshToken: string): void => {
  wx.setStorageSync('accessToken', accessToken);
  wx.setStorageSync('refreshToken', refreshToken);
};

// 基础配置
const BASE_URL = 'https://your-api-domain.com'; // 替换为实际 API 地址
const TIMEOUT = 80000;

// 是否正在刷新的标记
let isRefreshing = false;
// 重试请求队列
let refreshSubscribers: ((token: string) => void)[] = [];

// 将请求加入刷新队列
const subscribeTokenRefresh = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
};

// 刷新 Token
const refreshToken = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // 先清空 accessToken，强制使用 refreshToken
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
          // 保存新 token
          setTokens(data.atoken, data.rtoken);
          resolve(data);
        } else {
          reject(data);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// 处理刷新后的请求
const onTokenRefreshed = (newToken: string): void => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// 请求配置接口
interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
}

// API 响应接口
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
 * 请求封装
 */
const request = <T = any>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    // 构建 header
    const header: Record<string, string> = {
      'content-type': 'application/x-www-form-urlencoded',
      ...options.header
    };

    // 添加 token
    const accessToken = getAccessToken();
    header['token'] = accessToken || getRefreshToken();

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
        reject(err);
      }
    });
  });
};

/**
 * 带 Token 刷新的请求封装
 */
const requestWithRefresh = <T = any>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    const accessToken = getAccessToken();

    // 构建 header
    const header: Record<string, string> = {
      'content-type': 'application/x-www-form-urlencoded',
      ...options.header
    };

    // 根据是否有 accessToken 选择使用哪个 token
    header['token'] = accessToken || getRefreshToken();

    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: options.timeout || TIMEOUT,
      success: (res) => {
        const { statusCode, data } = res;
        const responseData = data as ApiResponse;

        // 请求成功
        if (statusCode >= 200 && statusCode < 300) {
          resolve(responseData as T);
          return;
        }

        // 401 未授权
        if (statusCode === 401) {
          handleUnauthorized(options, resolve, reject);
          return;
        }

        // 5000 业务错误码（Token 过期）
        if (responseData.detail && responseData.detail.code === 5000 && !options.url.includes('/refresh')) {
          handleTokenExpired(options, resolve, reject);
          return;
        }

        // 其他错误
        reject(responseData);
      },
      fail: (err) => {
        // 网络错误
        if (err.errMsg && err.errMsg.includes('request:fail')) {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
        }
        reject(err);
      }
    });
  });
};

/**
 * 处理 401 未授权
 */
const handleUnauthorized = <T = any>(
  options: RequestOptions,
  resolve: (value: T) => void,
  reject: (reason?: any) => void
): void => {
  // 跳转到登录页
  wx.removeStorageSync('accessToken');
  wx.removeStorageSync('refreshToken');

  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none'
  });

  // 延迟跳转登录页
  setTimeout(() => {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  }, 1500);

  reject({ code: 401, message: '未授权' } as any);
};

/**
 * 处理 Token 过期，尝试刷新
 */
const handleTokenExpired = <T = any>(
  options: RequestOptions,
  resolve: (value: T) => void,
  reject: (reason?: any) => void
): void => {
  // 清空 accessToken，标记需要刷新
  wx.removeStorageSync('accessToken');

  if (isRefreshing) {
    // 正在刷新，将请求加入队列
    return subscribeTokenRefresh(() => {
      // 刷新成功后，重新执行请求
      requestWithRefresh<T>(options).then(resolve).catch(reject);
    });
  }

  isRefreshing = true;

  // 执行刷新
  refreshToken()
    .then((res) => {
      isRefreshing = false;
      onTokenRefreshed(res.atoken);

      // 重试当前请求
      requestWithRefresh<T>(options).then(resolve).catch(reject);
    })
    .catch((err) => {
      isRefreshing = false;
      refreshSubscribers = [];

      // 刷新失败，跳转登录
      handleUnauthorized<T>(options, resolve, reject);
    });
};

// 导出请求方法
export default {
  // 基础请求（无 token 刷新）
  request,

  // 带 token 刷新的请求
  requestWithRefresh,

  // 刷新 token
  refreshToken,

  // 设置 token
  setTokens,

  // 获取 token
  getAccessToken,
  getRefreshToken,

  // 清空 token
  clearTokens: (): void => {
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('refreshToken');
  },

  // 检查是否已登录
  isLoggedIn: (): boolean => {
    return !!getRefreshToken();
  }
};

// 导出类型
export {
  RequestOptions,
  ApiResponse
};
