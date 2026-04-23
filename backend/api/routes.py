from fastapi import APIRouter, HTTPException, WebSocket, File, UploadFile
from fastapi.responses import FileResponse
from backend.models.schemas import (
    TranslationRequest, TranslationResponse,
    ChatMessage, ChatResponse,
    LanguageDetectionRequest, LanguageDetectionResponse
)
from backend.services.translation import translation_service
from backend.services.language import LanguageDetector
from backend.services.chat import chat_engine
from backend.services.cache import cache_manager
from gtts import gTTS
import uuid
import os
import shutil

router = APIRouter()

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "LingoFlow AI Advanced Backend"}

@router.post("/detect-language", response_model=LanguageDetectionResponse)
async def detect_language(request: LanguageDetectionRequest):
    detector = LanguageDetector()
    result = detector.detect(request.text)
    return LanguageDetectionResponse(**result)

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    cache_key = f"trans_{request.text}_{request.source_lang}_{request.target_lang}_{request.mode}"
    cached = await cache_manager.get(cache_key)
    if cached:
        return TranslationResponse(**cached)
        
    try:
        result = await translation_service.translate(
            text=request.text,
            target_lang=request.target_lang,
            source_lang=request.source_lang,
            mode=request.mode
        )
        
        await cache_manager.set(cache_key, result)
        return TranslationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatMessage):
    try:
        # Pipeline Step 1: Translate User Message to English (Internal processing lang)
        user_translation = await translation_service.translate(
            text=request.text,
            target_lang="en",
            source_lang="auto",
            mode=request.mode
        )
        
        user_english_text = user_translation["translated_text"]
        user_source_lang = user_translation["source_lang"]
        
        # Pipeline Step 2: Send to AI Chat Engine
        ai_result = await chat_engine.generate_response(
            session_id=request.session_id,
            message=user_english_text,
            mode=request.mode
        )
        
        ai_english_text = ai_result["response"]
        
        # Pipeline Step 3: Translate AI Response back to User's target language
        ai_translation = await translation_service.translate(
            text=ai_english_text,
            target_lang=request.target_lang,
            source_lang="en",
            mode=request.mode
        )
        
        return ChatResponse(
            user_original=request.text,
            user_translated=user_english_text,
            ai_original=ai_english_text,
            ai_translated=ai_translation["translated_text"],
            target_lang=request.target_lang,
            mode_used=ai_result["mode_used"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())
    try:
        while True:
            data = await websocket.receive_json()
            text = data.get("text")
            target_lang = data.get("target_lang", "en")
            mode = data.get("mode", "auto")
            
            ai_result = await chat_engine.generate_response(
                session_id=session_id,
                message=text,
                mode=mode
            )
            
            await websocket.send_json({
                "response": ai_result["response"],
                "mode_used": ai_result["mode_used"]
            })
    except Exception as e:
        print(f"WebSocket Error: {e}")

@router.post("/text-to-speech")
async def text_to_speech(text: str, lang: str):
    try:
        tts = gTTS(text=text, lang=lang)
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(TEMP_DIR, filename)
        tts.save(filepath)
        return FileResponse(filepath, media_type="audio/mpeg", filename=filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    # Mocking STT for now to avoid heavy dependencies unless needed
    return {"text": "This is a simulated speech-to-text output from LingoFlow.", "language": "en"}
