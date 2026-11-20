
后端python接口

```python
# 登录接口，获取token
# base_url : "https:zishu.co/api/users/"
@router.post("/token", response_model=TokenModel)
async def login_for_access_token(phone: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = check_user(db, phone, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    # access过期时间
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # refresh过期时间
    refresh_token_expires = timedelta(minutes=10080)
    # 把id进行username加密，要使用str类型
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=refresh_token_expires
    )
    user.atoken = access_token
    user.rtoken = refresh_token
    return user

@router.get("/refresh", response_model=TokenModel)
async def get_refresh_token(*, user: TokenModel = Depends(check_jwt_token)):
    # access过期时间
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # refresh过期时间
    refresh_token_expires = timedelta(minutes=10080)
    # 把id进行username加密，要使用str类型
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=refresh_token_expires
    )
    user.atoken = access_token
    user.rtoken = refresh_token
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
```





