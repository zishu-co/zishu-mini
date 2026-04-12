<template>
  <el-card class="recommendation-card" shadow="hover">
    <!-- 卡片头部 -->
    <template #header>
      <div class="card-header">
        <span class="card-title">
          <el-icon><Aim /></el-icon>
          今日最值得做
        </span>
        <div class="card-actions">
          <el-tooltip content="查看推荐算法说明" placement="top">
            <el-button 
              type="text" 
              @click="showAlgorithmInfo = true"
              :icon="InfoFilled"
              size="small"
            />
          </el-tooltip>
          <el-button 
            type="text" 
            @click="refreshRecommendations"
            :loading="refreshing"
            :icon="Refresh"
            size="small"
          >
            刷新
          </el-button>
        </div>
      </div>
    </template>

    <!-- 推荐列表 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="error" class="error-container">
      <el-result 
        icon="error" 
        title="获取推荐失败" 
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="loadRecommendations">重试</el-button>
        </template>
      </el-result>
    </div>

    <div v-else-if="recommendations.length === 0" class="empty-container">
      <el-empty description="暂无推荐内容" />
    </div>

    <div v-else class="recommendation-list">
      <div 
        v-for="(item, index) in recommendations" 
        :key="item.id"
        class="recommendation-item"
        @click="handleItemClick(item)"
      >
        <!-- 推荐序号和类型图标 -->
        <div class="item-index">
          <span class="index-number">{{ index + 1 }}</span>
          <el-icon class="type-icon" :class="getTypeIconClass(item.type)">
            <component :is="getTypeIcon(item.type)" />
          </el-icon>
        </div>

        <!-- 推荐内容 -->
        <div class="item-content">
          <div class="item-header">
            <h4 class="item-title">{{ item.title }}</h4>
            <el-tooltip :content="getUrgencyTooltip(item)" placement="top">
              <el-tag 
                :type="getUrgencyType(item.urgency_level)" 
                size="small"
                class="urgency-tag"
              >
                {{ getUrgencyText(item.urgency_level) }}
              </el-tag>
            </el-tooltip>
          </div>

          <p class="item-description">{{ item.description }}</p>

          <div class="item-meta">
            <span class="estimated-time">
              <el-icon><Clock /></el-icon>
              {{ item.estimated_time }}
            </span>
            <span v-if="item.deadline" class="deadline">
              <el-icon><Calendar /></el-icon>
              {{ formatDeadline(item.deadline) }}
            </span>
            <span class="score">
              <el-icon><TrendCharts /></el-icon>
              {{ Math.round(item.score) }}分
            </span>
          </div>

          <!-- 推荐理由 -->
          <div class="item-reasons">
            <el-tag 
              v-for="reason in item.reasons.slice(0, 2)" 
              :key="reason"
              size="small"
              type="info"
              effect="plain"
              class="reason-tag"
            >
              {{ reason }}
            </el-tag>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="item-actions">
          <el-button 
            type="primary" 
            size="small"
            @click.stop="handleAction(item)"
            :loading="actionLoading[item.id]"
          >
            {{ item.action_text }}
          </el-button>
          <el-button 
            type="text" 
            size="small"
            @click.stop="explainRecommendation(item)"
            :icon="QuestionFilled"
          >
            为什么推荐
          </el-button>
        </div>
      </div>
    </div>

    <!-- 更新时间 -->
    <div v-if="lastUpdated" class="update-info">
      <span class="update-time">
        <el-icon><Clock /></el-icon>
        更新于 {{ formatUpdateTime(lastUpdated) }}
      </span>
      <span v-if="nextRefresh" class="next-refresh">
        下次自动刷新: {{ formatUpdateTime(nextRefresh) }}
      </span>
    </div>
  </el-card>

  <!-- 推荐解释弹窗 -->
  <el-dialog 
    v-model="showExplanation" 
    title="推荐原因分析"
    width="600px"
  >
    <div v-if="currentExplanation" class="explanation-content">
      <h4>{{ currentExplanation.title }}</h4>
      <div class="score-overview">
        <el-progress 
          :percentage="currentExplanation.total_score" 
          :color="getScoreColor(currentExplanation.total_score)"
          :stroke-width="12"
        >
          <span class="score-text">{{ Math.round(currentExplanation.total_score) }}分</span>
        </el-progress>
      </div>

      <div class="score-breakdown">
        <h5>得分构成：</h5>
        <div 
          v-for="(score, key) in currentExplanation.score_breakdown" 
          :key="key"
          class="score-item"
        >
          <div class="score-label">
            <span>{{ score.description }}</span>
            <span class="weight">权重: {{ score.weight }}</span>
          </div>
          <el-progress 
            :percentage="score.score" 
            :stroke-width="8"
            :show-text="false"
          />
          <span class="score-value">{{ Math.round(score.score) }}分</span>
        </div>
      </div>

      <div class="reasons-section">
        <h5>推荐理由：</h5>
        <ul class="reasons-list">
          <li v-for="reason in currentExplanation.reasons" :key="reason">
            {{ reason }}
          </li>
        </ul>
      </div>
    </div>
  </el-dialog>

  <!-- 算法说明弹窗 -->
  <el-dialog 
    v-model="showAlgorithmInfo" 
    title="推荐算法说明"
    width="500px"
  >
    <div class="algorithm-info">
      <p>我们的推荐算法基于以下四个维度综合评分：</p>
      <ul>
        <li><strong>时间紧迫度 (35%)</strong>：距离截止时间越近，优先级越高</li>
        <li><strong>重要程度 (30%)</strong>：任务的重要性和影响范围</li>
        <li><strong>个人匹配度 (25%)</strong>：基于您的技能和兴趣进行匹配</li>
        <li><strong>成长价值 (10%)</strong>：完成后对个人发展的帮助</li>
      </ul>
      <p>算法会确保推荐的多样性，避免同类型任务扎堆。</p>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { 
  Aim, Refresh, InfoFilled, QuestionFilled, 
  Clock, Calendar, TrendCharts,
  Reading, Suitcase, ChatLineRound, Document, VideoPlay
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { recommendationAPI } from '@/api/recommendation'

// 接口定义
interface RecommendationItem {
  id: string
  type: string
  title: string
  description: string
  action_text: string
  action_url: string
  score: number
  urgency: number
  importance: number
  personal_fit: number
  growth_value: number
  estimated_time: string
  deadline?: string
  urgency_level?: string
  reasons: string[]
}

interface ExplanationData {
  title: string
  total_score: number
  score_breakdown: Record<string, any>
  reasons: string[]
}

// 响应式数据
const loading = ref(false)
const refreshing = ref(false)
const error = ref('')
const recommendations = ref<RecommendationItem[]>([])
const lastUpdated = ref('')
const nextRefresh = ref('')

const showExplanation = ref(false)
const showAlgorithmInfo = ref(false)
const currentExplanation = ref<ExplanationData | null>(null)

const actionLoading = reactive<Record<string, boolean>>({})

// 获取推荐数据
const loadRecommendations = async (refresh = false) => {
  try {
    if (refresh) {
      refreshing.value = true
    } else {
      loading.value = true
    }
    error.value = ''

    const response = await recommendationAPI.getTop3(refresh)
    
    if (response.data.code === 200) {
      const data = response.data.data
      recommendations.value = data.recommendations || []
      lastUpdated.value = data.last_updated
      nextRefresh.value = data.next_refresh

      if (refresh) {
        ElMessage.success('推荐已刷新')
      }
    } else {
      throw new Error(response.data.message || '获取推荐失败')
    }
  } catch (err: any) {
    error.value = err.message || '网络请求失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 刷新推荐
const refreshRecommendations = () => {
  loadRecommendations(true)
}

// 处理推荐项点击
const handleItemClick = (item: RecommendationItem) => {
  // 记录点击事件
  recommendationAPI.submitFeedback(item.id, 'click')
}

// 处理操作按钮点击
const handleAction = async (item: RecommendationItem) => {
  try {
    actionLoading[item.id] = true
    
    // 记录操作反馈
    await recommendationAPI.submitFeedback(item.id, 'click')
    
    // 跳转到目标页面
    if (item.action_url.startsWith('http')) {
      window.open(item.action_url, '_blank')
    } else {
      // 这里需要根据实际情况处理内部路由跳转
      window.open(`https://zishu.co${item.action_url}`, '_blank')
    }
    
    ElMessage.success(`已为您打开${item.action_text}页面`)
    
  } catch (err) {
    ElMessage.error('操作失败')
  } finally {
    actionLoading[item.id] = false
  }
}

// 解释推荐原因
const explainRecommendation = async (item: RecommendationItem) => {
  try {
    const response = await recommendationAPI.explainRecommendation(item.id)
    
    if (response.data.code === 200) {
      currentExplanation.value = response.data.data
      showExplanation.value = true
    } else {
      throw new Error(response.data.message)
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取推荐解释失败')
  }
}

// 获取类型图标
const getTypeIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    'COURSE_URGENT': Reading,
    'COURSE_POPULAR': Reading,
    'TASK_CLAIM': Suitcase,
    'GOAL_TALK': ChatLineRound,
    'REPORT_TIME': Document,
    'PROFILE_COMPLETE': Document,
    'EXAM_PUBLISH': Document,
    'COURSE_PUBLISH': VideoPlay
  }
  return iconMap[type] || Document
}

// 获取类型图标样式类
const getTypeIconClass = (type: string) => {
  const classMap: Record<string, string> = {
    'COURSE_URGENT': 'course-icon',
    'COURSE_POPULAR': 'course-icon',
    'TASK_CLAIM': 'task-icon',
    'GOAL_TALK': 'goal-icon',
    'REPORT_TIME': 'report-icon',
    'PROFILE_COMPLETE': 'profile-icon'
  }
  return classMap[type] || 'default-icon'
}

// 获取紧急度类型
const getUrgencyType = (level?: string) => {
  const typeMap: Record<string, string> = {
    'critical': 'danger',
    'high': 'warning',
    'medium': 'primary',
    'low': 'info'
  }
  return typeMap[level || 'low'] || 'info'
}

// 获取紧急度文本
const getUrgencyText = (level?: string) => {
  const textMap: Record<string, string> = {
    'critical': '非常紧急',
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return textMap[level || 'low'] || '低'
}

// 获取紧急度提示
const getUrgencyTooltip = (item: RecommendationItem) => {
  if (item.deadline) {
    const deadline = new Date(item.deadline)
    const now = new Date()
    const diffHours = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (diffHours <= 24) {
      return `距离截止还有${diffHours}小时`
    } else {
      const diffDays = Math.round(diffHours / 24)
      return `距离截止还有${diffDays}天`
    }
  }
  return `紧急度: ${getUrgencyText(item.urgency_level)}`
}

// 格式化截止时间
const formatDeadline = (deadline: string) => {
  const date = new Date(deadline)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天截止'
  } else if (diffDays === 1) {
    return '明天截止'
  } else if (diffDays > 0) {
    return `${diffDays}天后截止`
  } else {
    return '已逾期'
  }
}

// 格式化更新时间
const formatUpdateTime = (timeStr: string) => {
  const time = new Date(timeStr)
  return time.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取分数颜色
const getScoreColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  if (score >= 40) return '#f56c6c'
  return '#909399'
}

// 组件挂载时加载数据
onMounted(() => {
  loadRecommendations()
  
  // 设置自动刷新（每2小时）
  setInterval(() => {
    loadRecommendations(true)
  }, 2 * 60 * 60 * 1000)
})
</script>

<style scoped>
.recommendation-card {
  margin: 20px 0;
  max-width: 800px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.loading-container,
.error-container,
.empty-container {
  padding: 20px;
  text-align: center;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.recommendation-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.item-index {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 40px;
}

.index-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
}

.type-icon {
  font-size: 18px;
}

.course-icon { color: #67c23a; }
.task-icon { color: #e6a23c; }
.goal-icon { color: #409eff; }
.report-icon { color: #f56c6c; }
.profile-icon { color: #909399; }

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.urgency-tag {
  margin-left: 8px;
}

.item-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #909399;
}

.item-meta > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-reasons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.reason-tag {
  font-size: 12px;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  justify-content: center;
}

.update-info {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
}

.update-time,
.next-refresh {
  display: flex;
  align-items: center;
  gap: 4px;
}

.explanation-content {
  max-height: 500px;
  overflow-y: auto;
}

.explanation-content h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.score-overview {
  margin-bottom: 24px;
  text-align: center;
}

.score-text {
  font-weight: 600;
  font-size: 14px;
}

.score-breakdown h5,
.reasons-section h5 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.score-label {
  min-width: 140px;
  font-size: 13px;
}

.score-label .weight {
  display: block;
  color: #909399;
  font-size: 11px;
}

.score-value {
  min-width: 40px;
  text-align: right;
  font-size: 13px;
  color: #606266;
}

.reasons-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
}

.reasons-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.algorithm-info {
  line-height: 1.6;
  color: #606266;
}

.algorithm-info ul {
  margin: 16px 0;
  padding-left: 20px;
}

.algorithm-info li {
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .recommendation-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .item-index {
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .item-actions {
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .update-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>