from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_anon_key: str = "placeholder"
    supabase_service_key: str = "placeholder"
    jwt_secret: str = "campusshield-dev-secret-key-minimum-32-chars"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
