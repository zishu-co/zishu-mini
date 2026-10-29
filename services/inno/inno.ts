import { delay } from '../_utils/delay';
import base, { getBaseUrl } from '../base';

function innoRequest(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  contentType?: string;
  _isRetry?: boolean;
}): Promise<any> {
  const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
  return new Promise((resolve, reject) => {
    wx.request({
      url: getBaseUrl() + options.url,
      method: (options.method || 'GET') as any,
      data: options.data,
      header: {
        token,
        Authorization: token ? `Bearer ${token}` : '',
        'content-type': options.contentType || 'application/json',
      },
      success: (res: any) => {
        if (res.statusCode === 401) {
          if (!options._isRetry && wx.getStorageSync('refreshToken')) {
            base.refreshToken()
              .then(() => innoRequest({ ...options, _isRetry: true }))
              .then(resolve)
              .catch(() => reject({ statusCode: 401, errMsg: 'Unauthorized' }));
            return;
          }
          reject({ statusCode: 401, errMsg: 'Unauthorized' });
          return;
        }
        resolve(res.data);
      },
      fail: (err) => reject(err),
    });
  });
}

const images = [
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131419.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131515.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131539.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131603.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131643.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131705.jpg',
];

export interface TabItem {
  text: string;
  key: string;
}

export interface InnoData {
  swiper: string[];
  tabList: TabItem[];
  activityImg: string;
}

export interface Project {
  id: number;
  publisher: string;
  publisher_id: number;
  taker: string;
  taker_id: number;
  shushi: string;
  shushi_id: number;
  task_serial: string;
  title: string;
  required_courses: string;
  bonus: number;
  desc: string;
  task_text: string;
  sln_text: string;
  comment: string;
  start_date: string;
  deadline: string;
  planed_hour: number;
  half_progress: string;
  finish_date: string;
  actual_hour: number;
  total_hour: number;
  update_date: string;
  status: string;
}

/** 获取创新页基础数据（轮播图 + 标签栏） */
function mockFetchInno(): Promise<InnoData> {
  return Promise.resolve({
    swiper: images,
    tabList: [
      { text: '全部', key: '' },
      { text: '前端', key: 'F' },
      { text: '后端', key: 'B' },
      { text: '文档', key: 'D' },
      { text: '教程', key: 'T' },
      { text: '指南', key: 'G' },
      { text: '课程', key: 'C' },
      { text: '文件', key: 'W' },
    ],
    activityImg: '/img/activity.png',
  });
}

/** 从后端获取创新页基础数据 */
function fetchInnoFromApi(): Promise<InnoData> {
  return mockFetchInno();
}

const FALLBACK_PROJECTS: Project[] = [
  {
    id: 1,
    publisher: '青桐塾主',
    publisher_id: 1,
    taker: '',
    taker_id: 0,
    shushi: '林深塾师',
    shushi_id: 2,
    task_serial: 'F001',
    title: '自塾小程序学习中心与方舟交互体验升级',
    required_courses: 'Python 编程与自动化实战',
    bonus: 50,
    desc: '优化小程序学习中心卡片排版、弹窗独立滚动与方舟进度可视化组件。',
    task_text: '1. 完善课程卡片与章节步进展示\n2. 适配多端安全区与响应式布局\n3. 编写自动化回归验证脚本',
    sln_text: '',
    comment: '',
    start_date: '2026-10-20',
    deadline: '2026-11-20',
    planed_hour: 8,
    half_progress: '进行中',
    finish_date: '',
    actual_hour: 0,
    total_hour: 8,
    update_date: '2026-10-28',
    status: '待认领',
  },
  {
    id: 2,
    publisher: '林深塾师',
    publisher_id: 2,
    taker: '苏晓',
    taker_id: 101,
    shushi: '青桐塾主',
    shushi_id: 1,
    task_serial: 'B002',
    title: 'AI 伴学推荐引擎与目标拆解接口联调',
    required_courses: 'FastAPI 高并发后端架构',
    bonus: 60,
    desc: '基于用户阶段学习目标与课程进度，生成个性化 Top3 每日微行动推荐。',
    task_text: '实现 /api/actions/recommendations 智能评分与缓存策略。',
    sln_text: '已完成推荐打分模型与接口联调，单次响应耗时低于 50ms。',
    comment: '架构清晰，接口响应迅速！',
    start_date: '2026-10-15',
    deadline: '2026-11-15',
    planed_hour: 10,
    half_progress: '核心方案已完成 50%',
    finish_date: '',
    actual_hour: 6,
    total_hour: 10,
    update_date: '2026-10-28',
    status: '进行中',
  },
  {
    id: 3,
    publisher: '青桐塾主',
    publisher_id: 1,
    taker: '陈默',
    taker_id: 102,
    shushi: '林深塾师',
    shushi_id: 2,
    task_serial: 'D003',
    title: '自塾开源工程规范与新塾员共学手册沉淀',
    required_courses: 'AI 智能体与大模型应用开发',
    bonus: 40,
    desc: '整理自塾课程修习、方舟协作与创新课题揭榜全流程图文指南。',
    task_text: '输出结构化 Markdown 手册并配套示例脑图。',
    sln_text: '已完成全部章节文档编写与配图校对。',
    comment: '内容详实，已纳入新塾员必读指南。',
    start_date: '2026-10-01',
    deadline: '2026-10-25',
    planed_hour: 6,
    half_progress: '已完成',
    finish_date: '2026-10-24',
    actual_hour: 5,
    total_hour: 6,
    update_date: '2026-10-24',
    status: '已完成',
  },
];

/** 从后端获取进行中的项目列表 */
function fetchProjectsFromApi(): Promise<Project[]> {
  return new Promise((resolve) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/fetch_current_projects',
      method: 'GET',
      header: { token },
      success: (res: any) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          resolve(res.data);
        } else {
          resolve(FALLBACK_PROJECTS);
        }
      },
      fail: () => {
        resolve(FALLBACK_PROJECTS);
      },
    });
  });
}

/** 认领项目 */
function claimProject(projectId: number): Promise<{ code: string }> {
  return innoRequest({
    url: '/api/inno/edit_project/' + projectId,
    method: 'PUT',
    data: { 'params[action]': 'apply' },
    contentType: 'application/x-www-form-urlencoded',
  });
}

/** 获取指定类型的下一个课题编号 GET /api/inno/fetch_next_serial/{task_type} */
export function fetchNextSerial(taskType: string): Promise<string> {
  return innoRequest({
    url: '/api/inno/fetch_next_serial/' + encodeURIComponent(taskType || 'F'),
    method: 'GET',
  })
    .then((data) => (typeof data === 'string' ? data : `${taskType || 'F'}001`))
    .catch(() => `${taskType || 'F'}001`);
}

/** 发布新创新项目 POST /api/inno/add_project */
export function addInnoProject(data: {
  task_serial: string;
  title: string;
  required_courses?: string;
  bonus: number;
  desc: string;
  start_date: string;
  deadline: string;
  planed_hour: number;
}): Promise<any> {
  return innoRequest({
    url: '/api/inno/add_project',
    method: 'POST',
    data,
  });
}

/** 更新项目（半程汇报 / 结束汇报 / 编辑） PUT /api/inno/edit_project/{project_id} */
export function updateInnoProject(
  projectId: number,
  params: Record<string, any>
): Promise<any> {
  const payload: Record<string, any> = {};
  Object.keys(params || {}).forEach((k) => {
    payload[`params[${k}]`] = params[k];
  });
  return innoRequest({
    url: '/api/inno/edit_project/' + projectId,
    method: 'PUT',
    data: payload,
    contentType: 'application/x-www-form-urlencoded',
  });
}

/** 获取单个创新任务详情 GET /api/inno/get_task/{task_id} */
export function getInnoTaskDetail(taskId: number | string): Promise<any> {
  const tid = Number(taskId) || 1;
  const fallbackProj = FALLBACK_PROJECTS.find((p) => p.id === tid) || FALLBACK_PROJECTS[0];
  return innoRequest({
    url: '/api/inno/get_task/' + encodeURIComponent(String(tid)),
    method: 'GET',
  })
    .then((data) => (data && data.id ? data : fallbackProj))
    .catch(() => fallbackProj);
}

/** 保存/提交创新任务方案与塾师点评 POST /api/inno/save_task */
export function saveInnoTask(data: {
  id: number | string;
  action: 'save_pub' | 'save_sln' | 'submit_sln' | 'save_comment' | 'redo' | 'finish_task';
  content: string;
  title?: string;
  actual_hour?: number;
  reward?: number;
}): Promise<any> {
  return innoRequest({
    url: '/api/inno/save_task',
    method: 'POST',
    data: {
      id: String(data.id),
      action: data.action,
      content: data.content || '',
      title: data.title || '',
      actual_hour: Number(data.actual_hour || 0),
      reward: Number(data.reward || 0),
    },
  });
}

/** 获取全部共创小组列表 GET /api/inno/fetch_allgroup */
export function fetchAllGroupsFromApi(): Promise<any[]> {
  return innoRequest({
    url: '/api/inno/fetch_allgroup',
    method: 'GET',
  })
    .then((data) => (Array.isArray(data) ? data : []))
    .catch(() => []);
}

/** 申请加入创新共创小组 POST /api/inno/join_group */
export function joinInnoGroup(data: {
  groupid: number | string;
  groupname: string;
  reason: string;
}): Promise<any> {
  return innoRequest({
    url: '/api/inno/join_group',
    method: 'POST',
    data: {
      info: JSON.stringify(data),
    },
  });
}

/** 102-attend.md: 获取我的小组周报出席记录 GET /api/inno/fetch_myattend */
export function fetchMyAttend(): Promise<any[]> {
  return innoRequest({
    url: '/api/inno/fetch_myattend',
    method: 'GET',
  })
    .then((data) => (Array.isArray(data) ? data : []))
    .catch(() => []);
}

/** 102-attend.md: 保存小组周报考勤汇报 POST /api/inno/save_attend_report */
export function saveAttendReport(data: {
  attend_id?: number;
  group_id: number;
  member_id?: number;
  object: string;
  contrib: string;
  demand: string;
}): Promise<any> {
  return innoRequest({
    url: '/api/inno/save_attend_report',
    method: 'POST',
    data: {
      attend_id: Number(data.attend_id || 0),
      group_id: Number(data.group_id || 0),
      member_id: Number(data.member_id || 0),
      object: data.object || '',
      contrib: data.contrib || '',
      demand: data.demand || '',
    },
  });
}

/** 101-group.md: 获取共创小组详情与成员列表 GET /api/inno/get_group/{groupid} */
export function getInnoGroupDetail(groupId: number | string): Promise<any> {
  return innoRequest({
    url: '/api/inno/get_group/' + encodeURIComponent(String(groupId)),
    method: 'GET',
  })
    .then((data) => data || {})
    .catch(() => ({}));
}

/** 105-edit-group.md: 申请创建新共创小组 POST /api/inno/create_group */
export function createInnoGroup(data: {
  groupname: string;
  type: string;
  desc: string;
}): Promise<any> {
  return innoRequest({
    url: '/api/inno/create_group',
    method: 'POST',
    data: { info: JSON.stringify(data) },
  });
}

/** 105-edit-group.md: 保存/编辑共创小组信息 POST /api/inno/save_group */
export function saveInnoGroup(data: {
  groupid: number | string;
  groupname: string;
  type: string;
  must_course?: string;
  desc: string;
  join_us?: string;
}): Promise<any> {
  return innoRequest({
    url: '/api/inno/save_group',
    method: 'POST',
    data: { info: JSON.stringify(data) },
  });
}

/** 107-attend-review.md: 获取全站各小组周报公开记录 GET /api/inno/fetch_allattend */
export function fetchAllAttend(): Promise<any[]> {
  return innoRequest({
    url: '/api/inno/fetch_allattend',
    method: 'GET',
  })
    .then((data) => (Array.isArray(data) ? data : []))
    .catch(() => []);
}

/** 107-attend-review.md: 提交同行周报互评建议 (Start/Stop/Continue) POST /api/inno/save_advice */
export function saveAttendAdvice(data: {
  attend_id: number;
  receiver_id: number;
  begin: string;
  stop: string;
  keepon: string;
}): Promise<any> {
  return innoRequest({
    url: '/api/inno/save_advice',
    method: 'POST',
    data,
  });
}

/** 107-attend-review.md: 提交塾主周报评议反馈 POST /api/inno/save_feedback */
export function saveAttendFeedback(data: {
  attend_id: number;
  group_id: number;
  member_id: number;
  manner: string;
  feedback: string;
}): Promise<any> {
  return innoRequest({
    url: '/api/inno/save_feedback',
    method: 'POST',
    data,
  });
}

/** 104-project.md: 获取用户项目工时汇总清单 GET /api/inno/fetch_dockets/{user_id} */
export function fetchUserDockets(userId: number | string): Promise<any[]> {
  return new Promise((resolve) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/fetch_dockets/' + encodeURIComponent(String(userId)),
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
      fail: () => resolve([]),
    });
  });
}

/** 104-project.md: 获取用户工时打卡明细 GET /api/inno/get_tm/{user_id} */
export function getUserTimeRecords(userId: number | string): Promise<any[]> {
  return new Promise((resolve) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/get_tm/' + encodeURIComponent(String(userId)),
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
      fail: () => resolve([]),
    });
  });
}

export const fetchInno = fetchInnoFromApi;
export { fetchProjectsFromApi, claimProject };
