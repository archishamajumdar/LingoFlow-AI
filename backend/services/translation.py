from deep_translator import GoogleTranslator
from backend.services.language import LanguageDetector
from backend.core.config import settings
import logging

logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        self.detector = LanguageDetector()
        
    async def translate(self, text: str, target_lang: str, source_lang: str = "auto") -> dict:
        detected_lang = source_lang
        confidence = 1.0
        
        if source_lang == "auto":
            detection = self.detector.detect(text)
            detected_lang = detection["language"]
            confidence = detection["confidence"]
            
        if detected_lang == "unknown":
            detected_lang = "en" # fallback
            
        try:
            translated_text = GoogleTranslator(source=detected_lang, target=target_lang).translate(text)
            mode_used = "online"
        except Exception as e:
            logger.error(f"Online translation failed: {e}")
            raise e
                    
        return {
            "original_text": text,
            "translated_text": translated_text,
            "source_lang": detected_lang,
            "target_lang": target_lang,
            "confidence": confidence,
            "mode_used": mode_used
        }

translation_service = TranslationService()
