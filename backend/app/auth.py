from dataclasses import dataclass
from datetime import timedelta

from authx import AuthX, AuthXConfig, TokenPayload
from fastapi import Depends, HTTPException, status

from .config import settings


@dataclass(frozen=True)
class DemoUser:
    username: str
    password: str
    role: str


USERS = {
    "admin": DemoUser(username="admin", password="qwerty", role="admin"),
    "user": DemoUser(username="user", password="qwerty", role="user"),
}


config = AuthXConfig(
    JWT_SECRET_KEY=settings.jwt_secret_key,
    JWT_TOKEN_LOCATION=["headers", "cookies", "json"],
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=15),
    JWT_REFRESH_TOKEN_EXPIRES=timedelta(days=30),
    JWT_ACCESS_COOKIE_NAME="access_token",
    JWT_REFRESH_COOKIE_NAME="refresh_token",
    JWT_COOKIE_SECURE=False,
    JWT_COOKIE_HTTP_ONLY=True,
    JWT_COOKIE_CSRF_PROTECT=True,
)

security = AuthX(config=config)


def require_role(*allowed_roles: str):
    async def dependency(payload: TokenPayload = Depends(security.access_token_required)):
        allowed_scopes = {f"role:{role}" for role in allowed_roles}
        if not set(payload.scopes or []).intersection(allowed_scopes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав доступа",
            )
        return payload

    return dependency
