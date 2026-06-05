# import re
# from common.ocr_rules import OCR_RULES
# from common.ocr_detector import detect_document_type

# def analyze_document(text):
#     document_type = detect_document_type(text)

#     if document_type == "unknown":
#         return {
#             "document_type": "unknown",
#             "is_valid_document": False,
#             "remarks": ["Document type could not be detected"]
#         }

#     rules = OCR_RULES[document_type]
#     found_keywords = []
#     found_patterns = []

#     for keyword in rules["keywords"]:
#         if keyword in text.lower():
#             found_keywords.append(keyword)

#     for pattern in rules["patterns"]:
#         if re.search(pattern, text):
#             found_patterns.append(pattern)

#     is_valid = len(found_keywords) >= 2 or len(found_patterns) >= 1

#     return {
#         "document_type": document_type,
#         "keywords_found": found_keywords,
#         "patterns_found": found_patterns,
#         "is_valid_document": is_valid
#     }



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

        # =====================================================
        # KEYWORD MATCHING
        # =====================================================

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