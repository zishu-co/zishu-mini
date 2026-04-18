前端组件

```html
<div style="white-space: pre-wrap;">{{ goal.content }}</div>
    <div>阶段：{{ goal.start_date?goal.start_date.slice(0,10):'' }}到{{ goal.deadline?goal.deadline.slice(0,10):'' }}</div>
    <div>进度：{{ goal.process }}</div>
    <div style="white-space: pre-wrap;">{{ goal.review }}</div>
```

后端python接口

```python
# base_url : "http://127.0.0.1:8008/api/users/"
@router.get("/fetch_goal/{user_id}")
async def fetch_goal(user_id:int, db: Session = Depends(get_db)):
    goalitem = db.query(Goals).filter_by(user_id=user_id, end_time=None).first()
    goal_dict = {}
    if goalitem:
        goal_dict = goalitem.__dict__
        if "_sa_instance_state" in goal_dict:
            del goal_dict["_sa_instance_state"]
    return goal_dict
```

后端数据结构
```python
class Goals(Base):
    __tablename__ = 'goals'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer)
    content = Column(VARCHAR(500))
    start_time = Column(DateTime)
    deadline = Column(DateTime)
    process = Column(Integer)
    end_time = Column(DateTime)
    review = Column(VARCHAR(500))
```





