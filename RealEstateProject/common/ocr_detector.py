import re
from common.ocr_rules import OCR_RULES

def detect_document_type(text):
    text = text.lower()

    scores = {}

    for doc_type, rules in OCR_RULES.items():
        score = 0

        # Keyword matching
        for keyword in rules["keywords"]:
            if keyword in text:
                score += 1

        # Pattern matching
        for pattern in rules["patterns"]:
            if re.search(pattern, text):
                score += 2

        scores[doc_type] = score

    # Highest score wins
    detected = max(scores, key=scores.get)

    if scores[detected] == 0:
        return "unknown"

    return detected
