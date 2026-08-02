我的选课列表(Course.vue)  ──显示操作栏"申报学时"
   └─ 点"申报学时" → LearnSheet.vue 弹窗填时长 → 调 report_learn
        ├─ 还没到最后一课 → 后端返回 is_last_lesson:false → 自动跳下一课
        └─ 到最后一课 → 后端返回 is_last_lesson:true → 显示"结课"按钮
             └─ 点"结课" → 路由跳 FinishCourse.vue
                  ├─ 调 GET /learn/finish/{course_id} 取结课数据(含证书)
                  └─ 点"确认结课" → 调 POST /learn/finish/{course_id} 写 finish_time
                       └─ 该 selection 带 finish_time, 从"我的选课"消失


二、前端关键代码
文件	作用	关键点
frontend/src/views/course/Course.vue	我的选课列表 + 操作栏	调 fetchCurrentSelections 渲染列表；每行的 is_last_declared 决定显示"申报学时"还是"结课"按钮
frontend/src/views/learn/LearnSheet.vue	申报学时弹窗	提交 reportLearn，根据返回 is_last_lesson 决定"下一课"或"结课"跳转
frontend/src/views/learn/FinishCourse.vue	结课页面	调 getFinishCourseInfo 显示恭喜语+证书下载；点"确认结课"调 confirmFinishCourse，成功后再调 fetchCurrentSelections 刷新列表使其消失
frontend/src/request/learn/api.ts	learn 模块 API 封装	fetchCurrentSelections / reportLearn / getFinishCourseInfo / confirmFinishCourse
frontend/src/router/index.ts	路由注册	/learn/finish/:course_id → FinishCourse.vue
核心判断逻辑（Course.vue 操作栏）：

is_last_declared = current_serial >= total_chapters → 显示"结课"按钮
否则显示"申报学时"按钮
LearnSheet 跳转逻辑：
is_last_lesson ? router.push('/learn/finish/' + course_id) : 刷新到下一课


三、后端关键代码（backend/app/routers/learn.py）
端点	行号	作用
GET /learn/fetch_current_selections	398-429	返回"我的选课"列表，关键：is_last_declared = sele.current_serial >= total_chapters（420 行）；只查 finish_time=None 的记录（402 行）→ 结课后自然消失
POST /learn/report_learn	432-553	申报学时。写入 Report、计算塾值；next_serial 若找不到下一章返回 is_last_lesson:True（539-553）；否则 current_serial += 1 推进（547）
GET /learn/finish/{course_id}	2111-2190	结课页数据：课程/用户/方舟/测验成绩/证书相关字段（quiz_info、is_ark_learning 等）
POST /learn/finish/{course_id}	2193-2224	确认结课：给该 selection 写 finish_time = datetime.now()（2222 行）。方舟学习返回 403 拒绝个人结课
PATCH /learn/finish/{course_id}/homework	2227+	方舟学习者提交结课作业（补充逻辑）
结课消失的核心：fetch_current_selections 用 filter_by(user_id=..., finish_time=None)（402）——一旦 confirm_finish_course 写了 finish_time，该课就不在列表里了。

四、数据模型（backend/app/core/models/）
Selection — 选课记录，含 current_serial、finish_time、shushi_id（关键字段）
Chapter — 课程章节，serial 顺序决定"下一课"
Course — 课程，paper_id 关联结课测验证书
Report / Shuzhi — 申报学时记录与塾值流水
一句话总结链路：Course.vue 列表 → LearnSheet.vue 申报（report_learn 推进 current_serial，到尾返回 is_last_lesson）→ FinishCourse.vue 结课页（get_finish_course_info）→ confirm_finish_course 写 finish_time → 列表查询过滤掉已结课记录，课程消失。




Finishcourse.vue 结课页面
<template>
  <div class="finish-page">
    <div class="finish-card">
      <!-- 顶部标题 -->
      <div class="finish-header">
        <div class="congrats-icon">
          🎓
        </div>
        <h2>恭喜你完成课程！</h2>
        <p class="subtitle">
          《{{ courseInfo.course_title }}》
        </p>
      </div>

      <!-- 祝福语 -->
      <div class="blessing-section">
        <p class="blessing-text">
          祝贺 {{ courseInfo.user_name }} 成功学完《{{ courseInfo.course_title }}》！<br>
          祝愿你在人生路上能好好利用所学知识和技能，为自己创造更好的生活。
        </p>
      </div>

      <!-- 测验成绩区域（暂不显示） -->
      <!-- 测验成绩区域 -->
      <div
        v-if="quizInfo"
        class="quiz-section"
      >
        <h3>📋 结课测验</h3>
        <div
          class="quiz-score-box"
          :class="quizScoreClass"
        >
          <div class="quiz-score-inner">
            <span class="quiz-label">当前成绩</span>
            <span
              v-if="quizInfo.has_taken"
              class="quiz-score"
            >
              {{ quizInfo.current_score }} / {{ quizInfo.full_score }}
            </span>
            <span
              v-else
              class="quiz-score no-attempt"
            >未作答</span>
            <span
              class="quiz-status-tag"
              :class="quizScoreClass"
            >
              {{ quizStatusText }}
            </span>
          </div>
        </div>
        <el-button
          type="primary"
          plain
          class="quiz-btn"
          @click="goQuiz"
        >
          {{ quizInfo.has_taken ? '重新测验' : '参加测验' }}
        </el-button>
      </div>

      <!-- 方舟作业链接（方舟学习者填写） -->
      <div
        v-if="courseInfo.is_ark_learning"
        class="homework-section"
      >
        <h3>📝 方舟作业</h3>
        <p class="homework-tip">
          请提交你的结课作业（公网可访问的文章或视频链接），由舟长审批：
        </p>
        <div
          v-if="!courseInfo.ark_info?.homework_url"
          class="homework-input-row"
        >
          <el-input
            v-model="homeworkUrl"
            placeholder="https://..."
            size="large"
            class="homework-input"
          />
          <el-button
            type="primary"
            :loading="hwLoading"
            @click="submitHomework"
          >
            提交
          </el-button>
        </div>
        <div
          v-else
          class="homework-submitted"
        >
          <el-icon color="#67C23A">
            <Check />
          </el-icon>
          <span>已提交：</span>
          <el-link
            :href="courseInfo.ark_info.homework_url"
            target="_blank"
            class="homework-link"
          >
            {{ courseInfo.ark_info.homework_url }}
          </el-link>
        </div>
      </div>

      <!-- 方舟学习提示（无确认结课按钮） -->
      <div
        v-if="courseInfo.is_ark_learning"
        class="ark-tip"
      >
        <p>📌 方舟学习由舟长在方舟详情页统一为大家结课</p>
      </div>

      <!-- 结课证书（单人学习） -->
      <div
        v-if="!courseInfo.is_ark_learning"
        class="certificate-section"
      >
        <h3>🏆 结课证书</h3>
        <div class="certificate-placeholder">
          <div class="cert-content">
            <p class="cert-title">
              结课证书
            </p>
            <p class="cert-name">
              {{ courseInfo.user_name }}
            </p>
            <p class="cert-course">
              已完成《{{ courseInfo.course_title }}》全部课程学习
            </p>
            <p class="cert-date">
              {{ currentDate }}
            </p>
          </div>
        </div>
        <el-button
          type="primary"
          plain
          class="download-btn"
          @click="downloadCertificate"
        >
          下载证书
        </el-button>
      </div>

      <!-- 确认结课按钮（单人学习特有） -->
      <div
        v-if="!courseInfo.is_ark_learning"
        class="confirm-section"
      >
        <el-button
          type="success"
          size="large"
          class="confirm-btn"
          :loading="loading"
          @click="confirmFinish"
        >
          确认结课
        </el-button>
        <p class="confirm-tip">
          确认后这门课将从"我的选课"列表中消失
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { finishCourseAPI, getFinishCourseAPI, submitHomeworkAPI } from '../../request/learn/api'

const route = useRoute()
const router = useRouter()
const courseId = Number(route.params.course_id)
const loading = ref(false)
const currentDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

const courseInfo = ref<Record<string, any>>({
  course_id: courseId,
  course_title: '',
  user_name: '',
  is_ark_learning: false,
  ark_info: null,
  quiz_info: null,
  paper_id: null,
})
const homeworkUrl = ref('')
const hwLoading = ref(false)

const submitHomework = async () => {
  if (!homeworkUrl.value) {
    ElMessage.warning('请先填写作业链接')
    return
  }
  hwLoading.value = true
  try {
    await submitHomeworkAPI(Number(courseId), homeworkUrl.value)
    courseInfo.value.ark_info = courseInfo.value.ark_info || {}
    courseInfo.value.ark_info.homework_url = homeworkUrl.value
    ElMessage.success('作业链接已提交，等待舟长审批')
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    hwLoading.value = false
  }
}

// 测验成绩展示
const quizInfo = computed(() => courseInfo.value.quiz_info)

const quizScoreClass = computed(() => {
  if (!quizInfo.value) return ''
  if (!quizInfo.value.has_taken) return 'score-none'       // 粉红：未作答
  if (quizInfo.value.is_full_score) return 'score-full'    // 绿色：满分
  return 'score-partial'                                   // 黄色：部分分数
})

const quizStatusText = computed(() => {
  if (!quizInfo.value) return ''
  if (!quizInfo.value.has_taken) return '未作答'
  if (quizInfo.value.is_full_score) return '满分通过'
  return '未达满分'
})

const goQuiz = () => {
  if (!courseInfo.value.paper_id) {
    ElMessage.warning('该课程暂无结课测验')
    return
  }
  // 用当前页 origin 拼同源 URL，dev/prod/HTTPS/HTTP 都能正确跳转
  // ⚠️ 严禁硬编码 IP / 端口到代码里！之前硬编码 118.25.76.230:5173 在生产 HTTPS 页面上会跳到错的地址
  window.open(`${window.location.origin}/ques/dotest/${courseInfo.value.paper_id}`, '_blank')
}

onMounted(async () => {
  try {
    const res = await getFinishCourseAPI(courseId)
    if (res && res.code === '200') {
      courseInfo.value = { ...courseInfo.value, ...res }
    } else {
      ElMessage.error('获取结课信息失败')
      router.back()
    }
  } catch (e) {
    ElMessage.error('加载失败，请返回重试')
    router.back()
  }
})

const confirmFinish = async () => {
  loading.value = true
  try {
    const res = await finishCourseAPI(courseId)
    if (res && res.code === '200') {
      ElMessage.success('结课成功！')
      router.push('/learn')
    } else {
      ElMessage.error(res?.message || '结课失败，请重试')
    }
  } catch (e) {
    ElMessage.error('结课失败，请重试')
  } finally {
    loading.value = false
  }
}

const downloadCertificate = () => {
  ElMessage.info('证书下载功能正在开发中...')
}
</script>

<style scoped>
.finish-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.finish-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  max-width: 560px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.finish-header {
  text-align: center;
  margin-bottom: 30px;
}

.congrats-icon {
  font-size: 64px;
  margin-bottom: 10px;
}

.finish-header h2 {
  font-size: 26px;
  color: #333;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.blessing-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.blessing-text {
  color: #444;
  font-size: 15px;
  line-height: 1.8;
  margin: 0;
  text-align: center;
}

.quiz-section,
.homework-section {
  margin-bottom: 24px;
}

.quiz-section h3,
.homework-section h3,
.certificate-section h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 12px 0;
}

.homework-tip {
  color: #666;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.homework-link {
  font-size: 14px;
  word-break: break-all;
}

.quiz-score-box {
  border-radius: 12px;
  padding: 3px;
  display: inline-block;
  margin-bottom: 12px;
}
.quiz-score-inner {
  background: #fff;
  border-radius: 10px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.quiz-label {
  color: #666;
  font-size: 14px;
}
.quiz-score {
  font-size: 24px;
  font-weight: bold;
}
.quiz-score.no-attempt {
  color: #999;
  font-size: 16px;
}
.quiz-status-tag {
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 20px;
}
.score-none {
  background: #fff0f0;
  border: 1px solid #ffadc6;
}
.score-none .quiz-status-tag {
  background: #fff0f0;
  color: #e0396c;
}
.score-partial {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}
.score-partial .quiz-status-tag {
  background: #fffbe6;
  color: #d48806;
}
.score-full {
  background: #f0fdf4;
  border: 1px solid #b7eb8f;
}
.score-full .quiz-status-tag {
  background: #f0fdf4;
  color: #389e0d;
}
.homework-input-row { display: flex; gap: 12px; margin-top: 8px; }
.homework-input { flex: 1; }
.homework-submitted { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 14px; }
.quiz-btn {
  margin-top: 8px;
}

.ark-tip {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  text-align: center;
}

.ark-tip p {
  color: #8a6608;
  font-size: 14px;
  margin: 0;
}

.certificate-placeholder {
  background: linear-gradient(135deg, #f5f0e8, #fff8dc);
  border: 2px solid #d4af37;
  border-radius: 12px;
  padding: 30px 20px;
  margin-bottom: 16px;
}

.cert-content {
  text-align: center;
}

.cert-title {
  font-size: 22px;
  color: #8a6608;
  font-weight: bold;
  margin: 0 0 12px 0;
}

.cert-name {
  font-size: 20px;
  color: #333;
  margin: 0 0 8px 0;
}

.cert-course {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
}

.cert-date {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.download-btn {
  width: 100%;
  margin-bottom: 24px;
}

.confirm-section {
  text-align: center;
}

.confirm-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  margin-bottom: 10px;
}

.confirm-tip {
  color: #999;
  font-size: 12px;
  margin: 0;
}
</style>



# ── 结课相关接口 ────────────────────────────────────────────────────────────


@learn.get("/learn/finish/{course_id}")
async def get_finish_course_info(
    course_id: int,
    user: UserBase = Depends(check_jwt_token),
    db: Session = Depends(get_db),
):
    """获取结课页面数据"""
    # 获取选课记录
    selection = (
        db.query(Selection)
        .filter_by(user_id=user.id, course_id=course_id, finish_time=None)
        .first()
    )
    if not selection:
        return {"code": 404, "message": "未找到进行中的选课记录"}

    course = db.query(Course).filter_by(id=course_id).first()
    user_info = db.query(Users).filter_by(id=user.id).first()

    # 判断是否方舟学习：查 Crew 表
    crew = (
        db.query(Crew)
        .join(Ark, Crew.ark_id == Ark.id)
        .filter(
            Crew.user_id == user.id,
            Crew.quited == 0,
            Ark.course_id == course_id,
        )
        .first()
    )

    ark_info = None
    if crew:
        ark = db.query(Ark).filter_by(id=crew.ark_id).first()
        ark_info = {
            "ark_id": ark.id,
            "arkname": ark.arkname,
            "captain_id": ark.captain_id,
            "homework_url": crew.homework_url or "",
        }

    # 测验成绩（取选课日期之后该课程的 paperperform 最高分）
    quiz_info = None
    if course and course.paper_id:
        best = (
            db.query(Paperperform)
            .filter(
                Paperperform.user_id == user.id,
                Paperperform.paper_id == course.paper_id,
                Paperperform.start_time >= selection.create_time,
            )
            .order_by(Paperperform.getscore.desc())
            .first()
        )
        if best:
            quiz_info = {
                "has_taken": True,
                "current_score": float(best.getscore or 0),
                "full_score": float(best.fullscore or 0),
                "is_full_score": (best.getscore or 0) >= (best.fullscore or 0),
            }
        else:
            quiz_info = {
                "has_taken": False,
                "current_score": 0,
                "full_score": 0,
                "is_full_score": False,
            }

    return {
        "code": "200",
        "course_id": course_id,
        "course_title": course.title if course else "",
        "user_name": user_info.username if user_info else "",
        "is_ark_learning": crew is not None,
        "ark_info": ark_info,
        "selection_id": selection.id,
        "quiz_info": quiz_info,
        "paper_id": course.paper_id if course else None,
    }


@learn.post("/learn/finish/{course_id}")
async def confirm_finish_course(
    course_id: int,
    user: UserBase = Depends(check_jwt_token),
    db: Session = Depends(get_db),
):
    """确认结课（单人学习），填入 finish_time"""
    selection = (
        db.query(Selection)
        .filter_by(user_id=user.id, course_id=course_id, finish_time=None)
        .first()
    )
    if not selection:
        return {"code": 404, "message": "未找到进行中的选课记录"}

    # 方舟学习不允许个人结课
    crew = (
        db.query(Crew)
        .join(Ark, Crew.ark_id == Ark.id)
        .filter(
            Crew.user_id == user.id,
            Crew.quited == 0,
            Ark.course_id == course_id,
        )
        .first()
    )
    if crew:
        return {"code": 403, "message": "方舟学习由舟长统一结课"}

    selection.finish_time = datetime.now()
    db.commit()
    return {"code": "200"}


@learn.patch("/learn/finish/{course_id}/homework", response_model=dict)
async def submit_homework_url(
    course_id: int,
    body: SubmitHomeworkRequest,
    user: UserBase = Depends(check_jwt_token),
    db: Session = Depends(get_db),
):
    """方舟学习者提交/修改结课作业链接"""
    homework_url = body.homework_url.strip()

    if not homework_url:
        return {"code": 400, "message": "作业链接不能为空"}

    crew = (
        db.query(Crew)
        .join(Ark, Crew.ark_id == Ark.id)
        .filter(
            Crew.user_id == user.id,
            Crew.quited == 0,
            Ark.course_id == course_id,
        )
        .first()
    )
    if not crew:
        return {"code": 404, "message": "未找到进行中的方舟学习记录"}

    crew.homework_url = homework_url
    db.commit()
    return {"code": 200, "message": "作业链接已提交"}


