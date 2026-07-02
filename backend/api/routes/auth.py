from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt
from datetime import datetime, timedelta, timezone
import os
import re
from typing import Optional

from pydantic import BaseModel, EmailStr
from db.postgres import get_db, User
from db.tenants import provision_tenant

# In a real app, use passlib for hashing. For this task, we'll use a simple simulation if passlib is not available,
# but ideally we should install and use it.
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except ImportError:
    # Fallback for environment without passlib - NOT FOR PRODUCTION
    class DummyCryptContext:
        def hash(self, password): return "hashed_" + password
        def verify(self, password, hashed): return hashed == "hashed_" + password
    pwd_context = DummyCryptContext()

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text).strip('-')
    return text

@router.post("/register")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = request.email
    password = request.password
    tenant_name = request.tenant_name
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tenant_id = slugify(tenant_name)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Invalid tenant name")

    # Provision tenant
    await provision_tenant(tenant_id)

    # Create user
    new_user = User(
        email=email,
        hashed_password=pwd_context.hash(password),
        tenant_id=tenant_id
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {"message": "User and tenant created successfully", "tenant_id": tenant_id}

@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = request.email
    password = request.password
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user or not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "tenant_id": user.tenant_id},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
