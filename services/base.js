/**
 * 微信小程序请求基类
 * 实现双 Token 无感刷新机制
 */

// 获取存储的 token
const getAccessToken = () => wx.getStorageSync('accessToken') || '';
const getRefreshToken = () => wx.getStorageSync('refreshToken') || '';
const setTokens = (accessToken, refreshToken) => {
  wx.setStorageSync('accessToken', accessToken);
  wx.setStorageSync('refreshToken', refreshToken);
};

// 基础配置
const BASE_URL = 'https://127.0.0.1:8008'; // 替换为实际 API 地址
const TIMEOUT = 80000;

// 是否正在刷新的标记
let isRefreshing = false;
// 重试请求队列
let refreshSubscribers = [];

// 将请求加入刷新队列
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// 刷新 Token
const refreshToken = () => {
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
        if (res.data && res.data.id > 0) {
          // 保存新 token
          setTokens(res.data.atoken, res.data.rtoken);
          resolve(res.data);
        } else {
          reject(res.data);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// 处理刷新后的请求
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

/**
 * 请求封装
 * @param {Object} options 请求配置
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 构建 header
    const header = {
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
        // 响应成功
        if (res.data && res.data.detail && res.data.detail.code === 200) {
          resolve(res.data);
        } else {
          resolve(res.data);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * 带 Token 刷新的请求封装
 * @param {Object} options 请求配置
 */
const requestWithRefresh = (options) => {
  return new Promise((resolve, reject) => {
    const accessToken = getAccessToken();
    
    // 构建 header
    const header = {
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

        // 请求成功
        if (statusCode >= 200 && statusCode < 300) {
          resolve(data);
          return;
        }

        // 401 未授权
        if (statusCode === 401) {
          handleUnauthorized(options, resolve, reject);
          return;
        }

        // 5000 业务错误码（Token 过期）
        if (data && data.detail && data.detail.code === 5000 && !options.url.includes('/refresh')) {
          handleTokenExpired(options, resolve, reject);
          return;
        }

        // 其他错误
        reject(data);
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
const handleUnauthorized = (options, resolve, reject) => {
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

  reject({ code: 401, message: '未授权' });
};

/**
 * 处理 Token 过期，尝试刷新
 */
const handleTokenExpired = (options, resolve, reject) => {
  // 清空 accessToken，标记需要刷新
  wx.removeStorageSync('accessToken');

  if (isRefreshing) {
    // 正在刷新，将请求加入队列
    return subscribeTokenRefresh(() => {
      // 刷新成功后，重新执行请求
      requestWithRefresh(options).then(resolve).catch(reject);
    });
  }

  isRefreshing = true;

  // 执行刷新
  refreshToken()
    .then((res) => {
      isRefreshing = false;
      onTokenRefreshed(res.atoken);
      
      // 重试当前请求
      requestWithRefresh(options).then(resolve).catch(reject);
    })
    .catch((err) => {
      isRefreshing = false;
      refreshSubscribers = [];
      
      // 刷新失败，跳转登录
      handleUnauthorized(options, resolve, reject);
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
  clearTokens: () => {
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('refreshToken');
  },
  
  // 检查是否已登录
  isLoggedIn: () => {
    return !!getRefreshToken();
  }
};
