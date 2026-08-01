底部菜单栏点“我的”，进入我的页面，要改两个地方：

“学习”页面下，在“我的选课”下的 自塾时间管理这门课里点“选方舟”，进入选方舟页面。 这个页面里有一个方舟叫 测试塾师，有1男1女，但是右上角显示方舟已满，不应该这样呀，要满4个人才算满。请继续排查一下


# ── 4. 加入方舟 ──────────────────────────────────────────
@learn.post("/ark/join", response_model=dict)
async def ark_join(
    body: ArkJoinRequest,
    user: UserBase = Depends(check_jwt_token),
    db: Session = Depends(get_db),
):
    """加入方舟：检查性别比例、30天期限，写入Crew记录"""
    ark_id = body.ark_id
    ark = db.query(Ark).filter_by(id=ark_id).first()
    if not ark:
        return {"code": 404, "message": "方舟不存在"}
    if ark.closed:
        return {"code": 400, "message": "方舟已关闭"}
    # 检查是否已加入其他方舟
    existing = db.query(Crew).filter_by(user_id=user.id, quited=0).first()
    if existing and existing.ark_id == ark_id:
        return {"code": 400, "message": "您已在该方舟中"}
    # 获取用户性别
    user_obj = db.query(Users).filter_by(id=user.id).first()
    gender = user_obj.gender if user_obj else ""
    # 统计当前方舟各性别人数
    crews = db.query(Crew).filter_by(ark_id=ark_id, quited=0).all()
    male_count = sum(1 for c in crews if c.gender == "男")
    female_count = sum(1 for c in crews if c.gender == "女")
    if gender == "男" and male_count >= 2:
        return {"code": 400, "message": "该方舟男生已满2人"}
    if gender == "女" and female_count >= 2:
        return {"code": 400, "message": "该方舟女生已满2人"}
    # 如果已有退出者记录，先检查其是否可重新加入（简化处理：直接新增Crew）
    # 检查30天大限（用方舟create_time计算）
    expire_dt = ark.create_time + timedelta(days=30)
    if datetime.now() > expire_dt:
        close_ark(db, ark)
        return {"code": 400, "message": "该方舟已超过30天期限，已自动解散"}
    # 创建Crew记录
    crew = Crew(
        user_id=user.id,
        ark_id=ark_id,
        gender=gender,
        enter_time=datetime.now(),
        expire_time=expire_dt,
        is_captain=0,
        quited=0,
    )
    db.add(crew)
    db.commit()
    return {"code": 200, "message": "加入成功", "crew_id": crew.id}

class ArkJoinRequest(BaseModel):
    """加入方舟 (POST /api/learn/ark/join) — 实际字段 ark_id"""
    ark_id: int = Field(..., ge=1, description="方舟 id")


learn.ts:69 POST http://127.0.0.1:8008/api/learn/ark/join 422 (Unprocessable Entity)(env: Windows,mp,2.01.2510280; lib: 3.17.0)

点击加入方舟这个按钮，出现报错，请根据后端接口源码进行排查处理



学习这个页面正常来说，每个人最多选3门课。
选了其中一门后，这门课就会出现在“我的选课”部分中。而“全部课程”的这门课右边的按钮就会变成“退选”。当用户选了3门课后，“全部课程”的这门课右边的按钮就会变成“禁选”。请调整按钮的显示逻辑。