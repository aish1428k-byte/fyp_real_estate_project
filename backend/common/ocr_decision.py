



import re

from .ocr_rules import OCR_RULES


def analyze_document(ocr_text: str, expected_document_type: str):
    """
    Analyze OCR text and validate against expected type.
    """

    text = ocr_text.lower()

    best_match = None
    best_score = 0
    best_keywords = []

    for doc_type, rules in OCR_RULES.items():

        score = 0
        matched_keywords = []


        for keyword in rules["keywords"]:
            if keyword.lower() in text:
                score += 1
                matched_keywords.append(keyword)

        # =====================================================
        # REGEX PATTERN MATCHING
        # =====================================================

        for pattern in rules["patterns"]:
            if re.search(pattern, text, re.IGNORECASE):
                score += 1

        # =====================================================
        # PICK BEST MATCH
        # =====================================================

        if score > best_score:
            best_score = score
            best_match = doc_type
            best_keywords = matched_keywords

    # =========================================================
    # NO MATCH
    # =========================================================

    if not best_match:
        return {
            "is_valid": False,
            "detected_type": "unknown",
            "expected_type": expected_document_type,
            "score": 0,
            "min_score": 0,
            "keywords_found": [],
            "rejection_reason": "Could not identify document type."
        }

    rules = OCR_RULES[best_match]

    # =========================================================
    # VALIDATION
    # =========================================================

    if best_match != expected_document_type:
        return {
            "is_valid": False,
            "detected_type": best_match,
            "expected_type": expected_document_type,
            "score": best_score,
            "min_score": rules["min_score"],
            "keywords_found": best_keywords,
            "rejection_reason": (
                f"Document type mismatch. "
                f"Detected '{best_match}' "
                f"but expected '{expected_document_type}'."
            )
        }

    if best_score < rules["min_score"]:
        return {
            "is_valid": False,
            "detected_type": best_match,
            "expected_type": expected_document_type,
            "score": best_score,
            "min_score": rules["min_score"],
            "keywords_found": best_keywords,
            "rejection_reason": "OCR confidence too low."
        }

    # =========================================================
    # SUCCESS
    # =========================================================

    return {
        "is_valid": True,
        "detected_type": best_match,
        "expected_type": expected_document_type,
        "score": best_score,
        "min_score": rules["min_score"],
        "keywords_found": best_keywords,
        "rejection_reason": ""
    }