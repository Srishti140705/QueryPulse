from __future__ import annotations

import bcrypt
import hashlib
import json
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import jwt
import requests
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_sqlalchemy_engine
from app.models import Base, User

router = APIRouter(prefix="/oauth")

OAUTH_CONFIG = {
    "google": {
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "profile_url": "https://openidconnect.googleapis.com/v1/userinfo",
        "scopes": "openid email profile",
        "client_id_env": "GOOGLE_CLIENT_ID",
        "client_secret_env": "GOOGLE_CLIENT_SECRET",
        "redirect_uri_env": "GOOGLE_REDIRECT_URI",
    },
    "github": {
        "authorize_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "profile_url": "https://api.github.com/user",
        "scopes": "read:user user:email",
        "client_id_env": "GITHUB_CLIENT_ID",
        "client_secret_env": "GITHUB_CLIENT_SECRET",
        "redirect_uri_env": "GITHUB_REDIRECT_URI",
    },
    "microsoft": {
        "authorize_url": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
        "token_url": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
        "profile_url": "https://graph.microsoft.com/v1.0/me",
        "scopes": "openid profile email User.Read",
        "client_id_env": "MICROSOFT_CLIENT_ID",
        "client_secret_env": "MICROSOFT_CLIENT_SECRET",
        "redirect_uri_env": "MICROSOFT_REDIRECT_URI",
    },
}


def _settings(provider: str) -> dict:
    config = OAUTH_CONFIG.get(provider)
    if config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unsupported OAuth provider")

    client_id = os.getenv(config["client_id_env"])
    client_secret = os.getenv(config["client_secret_env"])
    redirect_uri = os.getenv(config["redirect_uri_env"])
    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"{provider.title()} OAuth is not configured")

    return {
        **config,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "tenant": os.getenv("MICROSOFT_TENANT_ID", "common"),
    }


def _frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173")


def _error_redirect(message: str) -> RedirectResponse:
    return RedirectResponse(f"{_frontend_url()}/login?{urlencode({'oauth_error': message})}")


def _profile(provider: str, access_token: str) -> tuple[str, str]:
    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}

    if provider == "google":
        response = requests.get(OAUTH_CONFIG[provider]["profile_url"], headers=headers, timeout=10)
        response.raise_for_status()
        profile = response.json()
        return profile.get("email", ""), profile.get("name") or profile.get("email", "").split("@")[0]

    if provider == "github":
        response = requests.get(OAUTH_CONFIG[provider]["profile_url"], headers=headers, timeout=10)
        response.raise_for_status()
        profile = response.json()
        email = profile.get("email")
        if not email:
            emails_response = requests.get("https://api.github.com/user/emails", headers=headers, timeout=10)
            emails_response.raise_for_status()
            email = next((item["email"] for item in emails_response.json() if item.get("primary") and item.get("verified")), "")
        return email, profile.get("login") or (email or "user").split("@")[0]

    response = requests.get(OAUTH_CONFIG[provider]["profile_url"], headers=headers, timeout=10)
    response.raise_for_status()
    profile = response.json()
    return profile.get("mail") or profile.get("userPrincipalName", ""), profile.get("displayName") or profile.get("userPrincipalName", "user").split("@")[0]


def _username(session: Session, preferred_name: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9_]", "_", preferred_name).strip("_")[:45] or "user"
    username = base
    suffix = 1
    while session.scalar(select(User).where(User.username == username)):
        suffix += 1
        username = f"{base[:45]}_{suffix}"
    return username


@router.get("/{provider}/authorize")
def authorize(provider: str):
    config = _settings(provider)
    state = jwt.encode(
        {"provider": provider, "exp": datetime.now(timezone.utc) + timedelta(minutes=10)},
        os.getenv("JWT_SECRET_KEY", "querypulse-development-secret"),
        algorithm="HS256",
    )
    authorize_url = config["authorize_url"].format(tenant=config["tenant"])
    return RedirectResponse(f"{authorize_url}?{urlencode({
        'client_id': config['client_id'],
        'redirect_uri': config['redirect_uri'],
        'response_type': 'code',
        'scope': config['scopes'],
        'state': state,
    })}")


@router.get("/{provider}/callback")
def callback(provider: str, request: Request):
    if request.query_params.get("error"):
        return _error_redirect(request.query_params.get("error_description") or "OAuth authentication was cancelled")

    try:
        state = jwt.decode(
            request.query_params.get("state", ""),
            os.getenv("JWT_SECRET_KEY", "querypulse-development-secret"),
            algorithms=["HS256"],
        )
        if state.get("provider") != provider:
            return _error_redirect("Invalid OAuth state")

        code = request.query_params.get("code")
        if not code:
            return _error_redirect("OAuth authorization code is missing")

        config = _settings(provider)
        token_response = requests.post(
            config["token_url"].format(tenant=config["tenant"]),
            data={
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "code": code,
                "redirect_uri": config["redirect_uri"],
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
            timeout=10,
        )
        token_response.raise_for_status()
        email, preferred_name = _profile(provider, token_response.json()["access_token"])
    except (jwt.PyJWTError, requests.RequestException, KeyError):
        return _error_redirect("OAuth authentication failed")

    if not email:
        return _error_redirect("OAuth provider did not return an email address")

    engine = get_sqlalchemy_engine()
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        user = session.scalar(select(User).where(User.email == email.lower()))
        if user is None:
            user = User(
                username=_username(session, preferred_name),
                email=email.lower(),
                password_hash=bcrypt.hashpw(secrets.token_urlsafe(32).encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        access_token = jwt.encode(
            {
                "sub": str(user.id),
                "username": user.username,
                "email": user.email,
                "exp": datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", "60"))),
            },
            os.getenv("JWT_SECRET_KEY", "querypulse-development-secret"),
            algorithm="HS256",
        )
        user_data = json.dumps({"id": user.id, "username": user.username, "email": user.email})
        return RedirectResponse(f"{_frontend_url()}/login#{urlencode({'access_token': access_token, 'user': user_data})}")
