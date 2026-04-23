from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class TranslationRequest(BaseModel):
    text: str
    source_lang: Optional[str] = "auto"
    target_lang: str
    mode: Optional[str] = "auto" # online, offline, auto

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    detected_lang: Optional[str] = None
    confidence: Optional[float] = None
    mode_used: str

class ChatMessage(BaseModel):
    text: str
    session_id: str
    target_lang: str
    mode: Optional[str] = "auto"

class ChatResponse(BaseModel):
    user_original: str
    user_translated: str
    ai_original: str
    ai_translated: str
    target_lang: str
    mode_used: str

class LanguageDetectionRequest(BaseModel):
    text: str

class LanguageDetectionResponse(BaseModel):
    language: str
    confidence: float
