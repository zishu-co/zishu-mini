/**
 * services/article/article.ts
 * 文章相关 API
 */

import base, { getBaseUrl } from '../base';

function getToken(): string {
  return wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
}

function request<T = any>(options: {
  url: string;
  method?: string;
  data?: any;
  _isRetry?: boolean;
}): Promise<T> {
  const token = getToken();
  return new Promise((resolve, reject) => {
    wx.request({
      url: getBaseUrl() + '/api' + options.url,
      method: (options.method || 'GET') as any,
      data: options.data,
      header: {
        'content-type': 'application/json',
        'token': token,
      },
      timeout: 80000,
      success: (res: any) => {
        if (res.statusCode === 401) {
          if (!options._isRetry && wx.getStorageSync('refreshToken')) {
            base.refreshToken()
              .then(() => request<T>({ ...options, _isRetry: true }))
              .then(resolve)
              .catch(() => reject({ statusCode: 401, errMsg: 'Unauthorized' }));
            return;
          }
          reject({ statusCode: 401, errMsg: 'Unauthorized' });
          return;
        }
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
