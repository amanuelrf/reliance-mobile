"""
Application Configuration
Manages environment variables and settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Project Info
    PROJECT_NAME: str = "Reliance Factor API"
    VERSION: str = "1.0.0"
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    EMAIL_LOGIN_CODE_EXPIRE_MINUTES: int = 10
    
    # Database - PostgreSQL (primary) and MySQL (legacy)
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "rf_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "rf_password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "reliance_factor")
    
    # MySQL (legacy)
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "reliance_factor")
    
    @property
    def DATABASE_URL(self) -> str:
        """Construct PostgreSQL database URL (primary)"""
        return f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:8081",  # Expo development
        "http://localhost:19006",  # Expo web
        "exp://localhost:8081",  # Expo Go
        "https://your-app-name.azurewebsites.net",  # Production
    ]
    
    # Azure Settings (for production)
    AZURE_KEYVAULT_URL: str = os.getenv("AZURE_KEYVAULT_URL", "")
    
    # FactorsNetwork API Settings
    FACTORS_NETWORK_BASE_URL: str = os.getenv("FACTORS_NETWORK_BASE_URL", "https://www.factorsnetwork.com")
    FACTORS_NETWORK_USERNAME: str = os.getenv("FACTORS_NETWORK_USERNAME", "")
    FACTORS_NETWORK_PASSWORD: str = os.getenv("FACTORS_NETWORK_PASSWORD", "")
    FACTORS_NETWORK_VERIFY_SSL: bool = os.getenv("FACTORS_NETWORK_VERIFY_SSL", "true").lower() == "true"
    FACTORS_NETWORK_TIMEOUT_SECONDS: float = float(os.getenv("FACTORS_NETWORK_TIMEOUT_SECONDS", "30.0"))
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra environment variables


# Create global settings instance
settings = Settings()
