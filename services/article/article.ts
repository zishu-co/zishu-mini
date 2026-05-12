/**
 * services/article/article.ts
 * 文章相关 API
 */

function getBaseUrl(): string {
  try {
    const { envVersion } = wx.getAccountInfoSync().miniProgram;
    switch (envVersion) {
      case 'develop': return 'https://zishu.co';
      case 'trial': return 'https://zishu.co';
      case 'release': return 'https://zishu.co';
      default: return 'https://zishu.co';
    }
  } catch (e) {
    return 'https://zishu.co';
  }
}

function getToken(): string {
  return wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
}

function request<T = any>(options: {
  url: string;
  method?: string;
  data?: any;
}): Promise<T> {
  const token = getToken();
  return new Promise((resolve, reject) => {
    wx.request({
      url: getBaseUrl() + '/api' + options.url,
      method: (options.method || 'GET') as any,
      data: options.data,
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': token,
      },
      timeout: 80000,
      success: (res: any) => {
        resolve(res.data as T);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

export interface Article {
  articleid: number;
  title: string;
  fulltext: string;
  author_id: number;
  author_name: string;
  coediting?: number;
  create_time?: string;
}

export interface ArticleDetail {
  articleid: number;
  varticle: string;
  author_id: number;
  author_name: string;
  bumen: string;
  title: string;
  create_time: string;
}

/** 获取文章列表 */
export function fetchArticleList() {
  return request<Article[]>({ url: '/article/index' });
}

/** 获取文章详情 */
export function fetchArticleDetail(articleid: number) {
  return request<ArticleDetail>({ url: `/article/article/${articleid}` });
}

/** 保存文章 */
export function saveArticle(data: { id: string; title: string; content: string }) {
  return request({ url: '/article/save', method: 'POST', data });
}

/** 删除文章 */
export function deleteArticle(id: string) {
  return request({ url: '/article/delete', method: 'POST', data: { id } });
}
