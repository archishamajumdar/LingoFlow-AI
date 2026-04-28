from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Neural Translate"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # LLM Settings
    OPENAI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    # Translation Settings
    ENABLE_OFFLINE_TRANSLATION: bool = True
    
    # Cache
    REDIS_URL: str = "" # If empty, use in-memory dictionary

settings = Settings()
