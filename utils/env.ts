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
    return !!(wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken'));
  } catch {
    return false;
  }
};

/** 判断角色字符串或用户对象是否为管理员 */
export const isAdminRole = (userOrRole: any): boolean => {
  if (!userOrRole) return false;
  if (typeof userOrRole === 'string') {
    const r = userOrRole.trim().toLowerCase();
    return r === 'admin' || r === '管理员' || r === 'superadmin' || r === '超级管理员';
  }
  if (typeof userOrRole === 'object') {
    if (userOrRole.is_admin === true || userOrRole.isAdmin === true) return true;
    const r = String(userOrRole.role || userOrRole.user_role || '').trim().toLowerCase();
    return r === 'admin' || r === '管理员' || r === 'superadmin' || r === '超级管理员';
  }
  return false;
};

/** 检查当前本地缓存登录用户是否为管理员 */
export const isCurrentUserAdmin = (): boolean => {
  try {
    if (!isLoggedIn()) return false;
    const app = typeof getApp === 'function' ? getApp<any>() : null;
    if (isAdminRole(app?.globalData?.userInfo)) return true;
    const storedUser = wx.getStorageSync('userInfo');
    if (isAdminRole(storedUser)) return true;
    const storedRole = wx.getStorageSync('userRole');
    if (isAdminRole(storedRole)) return true;
    return false;
  } catch {
    return false;
  }
};
