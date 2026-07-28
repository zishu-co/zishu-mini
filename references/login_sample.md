
后端python接口

```python
# 登录接口，获取token
# base_url : "https:zishu.co/api/users/"

# 小程序登录


class TTLDict:
    def __init__(self, ttl=100):
        self.ttl = ttl
        self._data = {}

    def __setitem__(self, key, value):
        # 清理过期数据
        now = time.time()
        self._data = {k: (v, t) for k, (v, t) in self._data.items() if t > now}
        # 存入新数据
        self._data[key] = (value, now + self.ttl)

    def __getitem__(self, key):
        value, expire = self._data[key]
        if time.time() > expire:
            del self._data[key]
            raise KeyError(key)
        return value

    def get(self, key, default=""):
        try:
            return self[key]
        except KeyError:
            return default


cachedict = TTLDict()


@router.get("/openid")
def get_openid(request: Request):
    v_param = request.query_params
    # appid = 'wxbad1559d1684aa9b'

    # 自塾
    appid = "wxb733ab430ac1a423"
    code = v_param.get("code")

    # app_secret = '15a507aea6ff47e7ec11e71086e964bf'  #从小程序管理控制台获取

    # 自塾
    app_secret = "55eef58be189df4829a1dbcb622fffc8"

    code2Session = "https://api.weixin.qq.com/sns/jscode2session?appid={}&secret={}&js_code={}&grant_type=authorization_code"

    code_url = code2Session.format(appid, app_secret, code)
    response = requests.get(code_url)  # 返回的是json数据
    json_response = response.json()  # 把json数据转换为字典
    print("返回结果：", json_response)
    if json_response.get("session_key"):
        tmp_id = uuid.uuid4()
        cachedict[tmp_id] = json_response.get("session_key")
        return tmp_id
    else:
        return False


def decrypt_phone_number(encrypted_data, iv, tmp_key):
    tmp_session_key = cachedict.get(tmp_key)
    if tmp_session_key:
        # 对session_key进行base64解码
        session_key = base64.b64decode(tmp_session_key)
        encrypted_data = base64.b64decode(encrypted_data)
        iv = base64.b64decode(iv)
        cipher = AES.new(session_key, AES.MODE_CBC, iv)
        decrypted_data = cipher.decrypt(encrypted_data)
        decrypted_data = decrypted_data[: -decrypted_data[-1]]
        decrypted_data = json.loads(decrypted_data)
        phone_number = decrypted_data.get("phoneNumber")
        return phone_number


# ---------- 发送个人信息 ----------
class SaveInfoRequest(BaseModel):
    roomNumber: str
    gender: str
    phoneNumber: str


@router.post("/saveinfo")
async def saveinfo(info: SaveInfoRequest, db: Session = Depends(get_db)):
    """发送个人信息"""
    print(info.roomNumber, info.gender, info.phoneNumber)
    # user = db.query(Users).filter(Users.phone == phoneNumber).first()
    # print(user.username)
    return {"msg": "success"}


class TokenRequest(BaseModel):
    encryptedData: str
    iv: str
    sessionkey: str


@router.post("/token_miniprogram", response_model=TokenModel)
async def login_for_access_token_miniprogram(
    info: TokenRequest, db: Session = Depends(get_db)
):
    phone = decrypt_phone_number(info.encryptedData, info.iv, info.sessionkey)
    user = db.query(Users).filter(Users.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    # access过期时间为7天
    access_token_expires = timedelta(days=7)
    # refresh过期时间为90天
    refresh_token_expires = timedelta(days=90)
    # 把id进行username加密，要使用str类型
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=refresh_token_expires
    )
    user.atoken = access_token
    user.rtoken = refresh_token
    user.phone = phone
    return user



```




返回的数据结构
```python
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    id: Optional[int] = False
    username: str = None
    # pip install pydantic[email] 使用email验证的时候需要增加这个库
    email: Optional[EmailStr] = None

    class Config:
        from_attributes = True


class TokenModel(UserBase):
    atoken: str = None
    rtoken: str = None
    phone: str = None
    id: int = None
    # 005-fix-hardcoded-admin: 客户端拿到 role 后，前端用 isAdmin getter
    # 替代 loginstate.id === 1 硬编码；保留 id=1 兜底兼容老前端
    role: str | None = "user"
```





