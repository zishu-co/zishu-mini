/**
 * 环境判断工具
 * develop = 开发版（真机调试 / 开发者工具）
 * trial   = 体验版
 * release = 正式版
 */

/** 当前是否为开发环境 */
export const isDevMode = (): boolean => {
  try {
    const { envVersion } = wx.getAccountInfoSync().miniProgram;
    return envVersion === 'develop';
  } catch {
    // 默认为生产模式（更安全）
    return false;
  }
};

/** 获取当前环境版本名称 */
export const getEnvVersion = (): string => {
  try {
    return wx.getAccountInfoSync().miniProgram.envVersion;
  } catch {
    return 'unknown';
  }
};

/** 检查当前是否游客模式 */
export const isGuestMode = (): boolean => {
  try {
    return !!wx.getStorageSync('guestMode');
  } catch {
    return false;
  }
};

/** 检查当前是否已登录（有有效token） */
export const isLoggedIn = (): boolean => {
  try {
    return !!wx.getStorageSync('refreshToken');
  } catch {
    return false;
  }
};
