import asyncio
import nest_asyncio
nest_asyncio.apply()
import requests
from backend.services.memory import session_memory
from backend.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AIChatEngine:
    async def generate_response(self, session_id: str, message: str, mode: str = "auto") -> dict:
        # Add user message to memory
        session_memory.add_message(session_id, "user", message)
        history = session_memory.get_history(session_id)
        
        mode_used = "online"
        ai_response = ""
        
        if mode == "offline":
            ai_response, mode_used = await self._try_ollama(history, message)
        else:
            # Try Online
            if settings.OPENAI_API_KEY:
                try:
                    import openai
                    openai.api_key = settings.OPENAI_API_KEY
                    from openai import AsyncOpenAI
                    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                    response = await client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=history
                    )
                    ai_response = response.choices[0].message.content
                    mode_used = "online"
                except Exception as e:
                    logger.error(f"OpenAI failed: {e}")
                    ai_response, mode_used = await self._try_ollama(history, message)
            else:
                # Try g4f free online LLM
                try:
                    import g4f
                    from g4f.client import AsyncClient
                    client = AsyncClient()
                    response = await client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=history,
                    )
                    ai_response = response.choices[0].message.content
                    mode_used = "online"
                except Exception as e:
                    logger.error(f"g4f failed: {e}")
                    ai_response, mode_used = await self._try_ollama(history, message)

        # Add AI response to memory
        session_memory.add_message(session_id, "assistant", ai_response)
        
        return {
            "response": ai_response,
            "mode_used": mode_used
        }

    async def _try_ollama(self, history, message):
        try:
            payload = {
                "model": "llama3",
                "messages": history,
                "stream": False
            }
            def make_request():
                return requests.post(f"{settings.OLLAMA_BASE_URL}/api/chat", json=payload, timeout=10.0)
            
            response = await asyncio.to_thread(make_request)
            if response.status_code == 200:
                return response.json().get("message", {}).get("content", ""), "offline"
            return self._fallback_response(message), "offline_fallback"
        except Exception as e:
            logger.error(f"Ollama failed: {e}")
            return self._fallback_response(message), "offline_fallback"

    def _fallback_response(self, text: str) -> str:
        replies = {
            "hello": "Hello! I am your AI translation assistant.",
            "how are you": "I'm doing great, thank you! Ready to translate.",
            "what can you do": "I can translate text and help with conversations."
        }
        for key in replies:
            if key in text.lower():
                return replies[key]
        return "I am currently running in limited offline mode. I understand you said something, but I cannot fully process it without an internet connection or local model."

chat_engine = AIChatEngine()
