from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from authx import TokenPayload
from pydantic import BaseModel

from ..auth import USERS, require_role, security


router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(credentials: LoginRequest, response: Response):
    user = USERS.get(credentials.username)
    if user is None or user.password != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )

    access_token = security.create_access_token(
        uid=user.username,
        scopes=[f"role:{user.role}"],
    )
    refresh_token = security.create_refresh_token(
        uid=user.username,
        scopes=[f"role:{user.role}"],
    )
    security.set_refresh_cookies(refresh_token, response)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": user.username, "role": user.role},
    }


@router.post("/refresh")
async def refresh(request: Request):
    refresh_token = await security.get_refresh_token_from_request(
        request,
        locations=["cookies", "json"],
    )
    payload = security.verify_token(refresh_token, verify_type=True)
    access_token = security.create_access_token(
        uid=payload.sub,
        scopes=payload.scopes,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    security.unset_refresh_cookies(response)
    return {"message": "Выход выполнен"}


@router.get("/me")
async def me(payload: TokenPayload = Depends(security.access_token_required)):
    return {
        "username": payload.sub,
        "role": (payload.scopes or ["role:user"])[0].removeprefix("role:"),
    }


@router.get("/admin-only")
async def admin_only(payload: TokenPayload = Depends(require_role("admin"))):
    return {"message": f"Здравствуйте, {payload.sub}. Доступ администратора разрешён."}


@router.get("/user-area")
async def user_area(payload: TokenPayload = Depends(require_role("user", "admin"))):
    return {"message": f"Здравствуйте, {payload.sub}. Доступ пользователя разрешён."}
