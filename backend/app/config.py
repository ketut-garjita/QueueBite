import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "QueueBite API"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./queuebite.db")
    HOST_PIN: str = os.getenv("HOST_PIN", "1234")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY", None)
    DEFAULT_RESTAURANT_NAME: str = "The Rustic Olive"
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
