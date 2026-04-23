from langdetect import detect, detect_langs

class LanguageDetector:
    @staticmethod
    def detect(text: str) -> dict:
        try:
            # detect_langs returns a list of Language objects, e.g., [en:0.999995]
            langs = detect_langs(text)
            if langs:
                best_match = langs[0]
                return {"language": best_match.lang, "confidence": best_match.prob}
            return {"language": "unknown", "confidence": 0.0}
        except Exception:
            return {"language": "unknown", "confidence": 0.0}
