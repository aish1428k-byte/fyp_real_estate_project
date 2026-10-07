# documents/services.py
"""
Property Document Upload Pipeline
──────────────────────────────────
Receives a file from the API view and runs the full verification flow:

  Step 1 — Save uploaded file to a temporary path on disk
  Step 2 — Run OCR on the temp file (backend only, no frontend Tesseract)
  Step 3 — Detect document type from OCR text
  Step 4 — Compare detected type vs the type the agent selected
  Step 5 — Reject immediately if they do not match
  Step 6 — Upload the file to Pinata IPFS and get a CID
  Step 7 — Store the CID on the DocumentRegistry smart contract
  Step 8 — Save everything to the Django DB (SQLite)
  Step 9 — Delete the temp file
  Step 10 — Return a structured result dict to the view

Database: SQLite (Django default — no changes needed)
"""

import logging
import os
import tempfile
import uuid
import re
from difflib import SequenceMatcher

from django.contrib.auth import get_user_model

# from common.blockchain_utils import BlockchainService
# from common.ipfs_utils import get_ipfs_gateway_url, upload_to_ipfs
from common.ocr_decision import analyze_document
from common.ocr_utils import extract_text_from_image
from property.models import Property

from .models import PropertyDocument

User = get_user_model()
logger = logging.getLogger(__name__)

MANDATORY_DOCUMENTS = [
    "cnic_front",
    "cnic_back",
    "allotment_letter",
]

def process_document_upload(
    *,
    file,
    property_id: int,
    expected_document_type: str,
    user,
) -> dict:

    from common.blockchain_utils import BlockchainService
    from common.ipfs_utils import upload_to_ipfs, get_ipfs_gateway_url


    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return _error_result(
            expected_document_type,
            f"Property with id={property_id} does not exist.",
        )

    temp_file_path = None   # kept in outer scope so finally can clean it up

    try:
        # ── Step 1: Save to temp file ─────────────────────────────────────────
        temp_file_path = _save_to_temp(file)

        # ── Step 2: OCR (backend only) ────────────────────────────────────────
        logger.info(
            "OCR starting — property=%s expected_type=%s",
            property_id, expected_document_type,
        )
        ocr_text = extract_text_from_image(temp_file_path)
        if not ocr_text.strip():
            raise Exception("OCR could not detect readable text.")
        


        # ── Step 2.5: CNIC owner-name validation ─────────────────────────────
        cnic_validation = None

        if expected_document_type == "cnic_front":
            cnic_validation = validate_cnic_owner(
                ocr_text=ocr_text,
                property_obj=property_obj,
            )

            if not cnic_validation["is_valid"]:
                reason = cnic_validation["rejection_reason"]

                ocr_result = {
                    "user_id": str(property_obj.owner.user_id),
                    "uploaded_by_user_id": str(user.user_id),
                    "document_type": "cnic_front",

                    "cnic_name": cnic_validation.get("cnic_name", ""),
                    "database_name": cnic_validation.get("database_name", ""),
                    "name_similarity": cnic_validation.get("similarity", 0),

                    "name_match": False,
                }

                doc = PropertyDocument.objects.create(
                    property=property_obj,
                    uploaded_by=user,
                    document_type="cnic_front",
                    status="rejected",
                    rejection_reason=reason,
                    ocr_result=ocr_result,
                )

                return {
                    "success": False,
                    "status": "rejected",
                    "document_id": doc.id,
                    "document_type": "cnic_front",
                    "ipfs_hash": "",
                    "ipfs_gateway_url": "",
                    "tx_hash": "",
                    "on_chain_document_id": None,
                    "block_number": None,
                    "rejection_reason": reason,
                    "ocr_result": ocr_result,
                    "message": f"CNIC rejected: {reason}",
                }


        # ── Step 3 & 4: Detect + compare ──────────────────────────────────────
        decision = analyze_document(ocr_text, expected_document_type)

        # Build a summary dict for storing in the DB's ocr_result JSON field

        ocr_result = {
            "user_id": str(property_obj.owner.user_id),
            "uploaded_by_user_id": str(user.user_id),

            "detected_type": decision["detected_type"],
            "expected_type": decision["expected_type"],
            "score": decision["score"],
            "min_score": decision["min_score"],
            "keywords_found": decision["keywords_found"],
        }

        # ── Step 5: Reject if mismatch or low confidence ──────────────────────
        if not decision["is_valid"]:
            reason = decision.get("rejection_reason") or "Document validation failed."
            logger.warning(
                "REJECTED — property=%s expected=%s detected=%s reason=%s",
                property_id, expected_document_type,
                decision["detected_type"], reason,
            )

            # Save a rejected record so the agent can see it in the UI
            doc = PropertyDocument.objects.create(
                property=property_obj,
                uploaded_by=user,
                document_type=(decision.get("expected_type") or expected_document_type),
                status="rejected",
                rejection_reason=reason,
                ocr_result=ocr_result,
            )

            return {
                "success":              False,
                "status":               "rejected",
                "document_id":          doc.id,
                "document_type":        doc.document_type,
                "ipfs_hash":            "",
                "ipfs_gateway_url":     "",
                "tx_hash":              "",
                "on_chain_document_id": None,
                "block_number":         None,
                "rejection_reason":     reason,
                "ocr_result":           ocr_result,
                "message":              f"Document rejected: {reason}",
            }

        detected_type = decision["detected_type"]

        # ── Step 6: Upload to Pinata IPFS ──────────────────────────────────────
        logger.info("Uploading to IPFS — type=%s", detected_type)
        cid         = upload_to_ipfs(
            temp_file_path
        )
        gateway_url = get_ipfs_gateway_url(cid)

        # ── Step 7: Store CID on blockchain ────────────────────────────────────
        # Uses the NEW DocumentRegistry contract via BlockchainService.
        # Your existing AuditLog contract is NOT called here.
        logger.info("Storing CID on blockchain — cid=%s", cid)
        bc      = BlockchainService()
        chain   = bc.store_document_hash(
            cid=cid,
            document_type=detected_type,
            property_id=property_id,
        )

       # ── Step 8: Save to SQLite DB ──────────────────────────────────────────
        doc = PropertyDocument.objects.create(
            property=property_obj,
            uploaded_by=user,
            document_type=detected_type,
            ipfs_hash=cid,
            ipfs_gateway_url=gateway_url,
            status="verified",
            ocr_result=ocr_result,
        )

        logger.info(
            "VERIFIED — doc_id=%s cid=%s",
            doc.id,
            cid,
        )

        return {
            "success": True,
            "status": "verified",
            "document_id": doc.id,
            "document_type": detected_type,
            "ipfs_hash": cid,
            "ipfs_gateway_url": gateway_url,
            "tx_hash": "",
            "on_chain_document_id": None,
            "block_number": None,
            "rejection_reason": "",
            "ocr_result": ocr_result,
            "message": "Document verified and uploaded to IPFS.",
        }
    except Exception as exc:
        logger.exception("Unexpected error in upload pipeline: %s", exc)
        return _error_result(expected_document_type, str(exc))

    finally:
        # ── Step 9: Always delete the temp file ───────────────────────────────
        _delete_temp(temp_file_path)


# ── Private helpers ───────────────────────────────────────────────────────────

def _save_to_temp(file) -> str:
    """Write the uploaded file to a unique temp path and return that path."""
    suffix = os.path.splitext(file.name)[-1] or ".bin"
    with tempfile.NamedTemporaryFile(
        delete=False, suffix=suffix, prefix="doc_upload_"
    ) as tmp:
        for chunk in file.chunks():
            tmp.write(chunk)
        return tmp.name


def _delete_temp(path) -> None:
    """Silently remove the temp file if it still exists."""
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except OSError as exc:
            logger.warning("Could not delete temp file %s: %s", path, exc)


def _error_result(document_type: str, message: str) -> dict:
    """Return a standard error result dict when the pipeline cannot even start."""
    return {
        "success":              False,
        "status":               "pending",
        "document_id":          None,
        "document_type":        document_type,
        "ipfs_hash":            "",
        "ipfs_gateway_url":     "",
        "tx_hash":              "",
        "on_chain_document_id": None,
        "block_number":         None,
        "rejection_reason":     message,
        "ocr_result":           {},
        "message":              f"Upload failed: {message}",
    }

# def validate_cnic_owner(*, ocr_text: str, property_obj) -> dict:
#     """
#     Validate that:
#     1. OCR text contains a CNIC owner name.
#     2. CNIC name matches the property's registered owner's name.
#     """

#     # Get property owner from Property table
#     property_owner = property_obj.owner

#     # Get user's full name from User table
#     database_name = property_owner.full_name.strip()

#     if not database_name:
#         return {
#             "is_valid": False,
#             "cnic_name": "",
#             "database_name": "",
#             "similarity": 0,
#             "rejection_reason": (
#                 "Property owner does not have a valid name in the database."
#             ),
#         }

#     # Extract name from OCR text
#     cnic_name = extract_cnic_name(ocr_text)

#     if not cnic_name:
#         return {
#             "is_valid": False,
#             "cnic_name": "",
#             "database_name": database_name,
#             "similarity": 0,
#             "rejection_reason": (
#                 "Could not detect the owner's name from the uploaded CNIC."
#             ),
#         }

#     # Normalize both names before comparison
#     normalized_cnic_name = normalize_name(cnic_name)
#     normalized_database_name = normalize_name(database_name)

#     # Calculate similarity
#     similarity = SequenceMatcher(
#         None,
#         normalized_cnic_name,
#         normalized_database_name,
#     ).ratio()

#     # 85% threshold
#     name_match = similarity >= 0.85

#     if not name_match:
#         return {
#             "is_valid": False,
#             "cnic_name": cnic_name,
#             "database_name": database_name,
#             "similarity": round(similarity, 3),
#             "rejection_reason": (
#                 f"CNIC owner name '{cnic_name}' does not match "
#                 f"the property owner's name '{database_name}'."
#             ),
#         }

#     return {
#         "is_valid": True,
#         "cnic_name": cnic_name,
#         "database_name": database_name,
#         "similarity": round(similarity, 3),
#         "rejection_reason": "",
#     }

def validate_cnic_owner(*, ocr_text: str, property_obj) -> dict:
    """
    Validate that:
    1. OCR text contains a CNIC owner name.
    2. CNIC name matches the property's registered owner's name.
    """

    # Get property owner from Property table
    property_owner = property_obj.owner

    # Get user's full name from User table
    database_name = property_owner.full_name.strip()

    # 🔴 DEBUG PRINTS
    print("\n================ CNIC DEBUG ================")
    print("PROPERTY ID:", property_obj.id)
    print("PROPERTY OWNER USER ID:", property_owner.user_id)
    print("PROPERTY OWNER USERNAME:", property_owner.username)
    print("DATABASE FIRST NAME:", property_owner.first_name)
    print("DATABASE LAST NAME:", property_owner.last_name)
    print("DATABASE FULL NAME:", database_name)

    print("\n----- RAW OCR TEXT -----")
    print(ocr_text)

    # Extract name from OCR text
    #cnic_name = extract_cnic_name(ocr_text)
    normalized_database_name = normalize_name(database_name)
    normalized_ocr_text = normalize_name(ocr_text)

    # First try to find the exact database owner name inside OCR text.
    # This handles OCR noise after/before the actual name.
    if normalized_database_name in normalized_ocr_text:
        cnic_name = database_name
        print("✅ DATABASE NAME FOUND DIRECTLY IN OCR")
        print("CNIC NAME:", cnic_name)
    else:
        cnic_name = extract_cnic_name(ocr_text)

    print("\n----- EXTRACTED CNIC NAME -----")
    print("CNIC NAME:", repr(cnic_name))

    if not database_name:
        print("❌ DATABASE NAME EMPTY")
        print("============================================\n")

        return {
            "is_valid": False,
            "cnic_name": cnic_name,
            "database_name": database_name,
            "similarity": 0,
            "rejection_reason": (
                "Property owner does not have a valid name in the database."
            ),
        }

    if not cnic_name:
        print("❌ CNIC NAME COULD NOT BE EXTRACTED")
        print("============================================\n")

        return {
            "is_valid": False,
            "cnic_name": "",
            "database_name": database_name,
            "similarity": 0,
            "rejection_reason": (
                "Could not detect the owner's name from the uploaded CNIC."
            ),
        }

    # Normalize both names
    normalized_cnic_name = normalize_name(cnic_name)
    normalized_database_name = normalize_name(database_name)

    print("\n----- NORMALIZED NAMES -----")
    print("NORMALIZED CNIC NAME:", repr(normalized_cnic_name))
    print("NORMALIZED DATABASE NAME:", repr(normalized_database_name))

    # Calculate similarity
    similarity = SequenceMatcher(
        None,
        normalized_cnic_name,
        normalized_database_name,
    ).ratio()

    print("\n----- NAME COMPARISON -----")
    print("CNIC NAME:", cnic_name)
    print("DATABASE NAME:", database_name)
    print("SIMILARITY:", similarity)
    print("SIMILARITY %:", round(similarity * 100, 2), "%")
    print("THRESHOLD:", 85, "%")

    name_match = similarity >= 0.85

    print("NAME MATCH:", name_match)

    if not name_match:

        print("❌ NAME MISMATCH → REJECTING CNIC")
        print("============================================\n")

        return {
            "is_valid": False,
            "cnic_name": cnic_name,
            "database_name": database_name,
            "similarity": round(similarity, 3),
            "rejection_reason": (
                f"CNIC owner name '{cnic_name}' does not match "
                f"the property owner's name '{database_name}'."
            ),
        }

    print("✅ NAME MATCH → CNIC ACCEPTED")
    print("============================================\n")

    return {
        "is_valid": True,
        "cnic_name": cnic_name,
        "database_name": database_name,
        "similarity": round(similarity, 3),
        "rejection_reason": "",
    }

# def extract_cnic_name(ocr_text: str) -> str:
#     """
#     Extract the CNIC holder's name from OCR text.

#     Expected OCR patterns can be like:
#         Name
#         Muhammad Ali

#     or:
#         Name: Muhammad Ali
#     """

#     lines = [
#         line.strip()
#         for line in ocr_text.splitlines()
#         if line.strip()
#     ]

#     for index, line in enumerate(lines):

#         normalized_line = line.lower().strip()

#         # Case 1:
#         # Name
#         # Muhammad Ali
#         if normalized_line in ["name", "name:", "full name", "full name:"]:
#             if index + 1 < len(lines):
#                 candidate = lines[index + 1].strip()

#                 if is_valid_name_candidate(candidate):
#                     return candidate

#         # Case 2:
#         # Name: Muhammad Ali
#         if normalized_line.startswith("name:"):
#             candidate = line.split(":", 1)[1].strip()

#             if is_valid_name_candidate(candidate):
#                 return candidate

#     return ""

def extract_cnic_name(ocr_text: str) -> str:

    print("\n----- OCR LINES -----")

    lines = [
        line.strip()
        for line in ocr_text.splitlines()
        if line.strip()
    ]

    for i, line in enumerate(lines):
        print(i, "=>", repr(line))

    # =========================================================
    # Normalize OCR text for searching
    # =========================================================

    text = " ".join(lines)
    normalized_text = text.lower()

    # =========================================================
    # CASE 1:
    # name: abdul khaliq sheikh
    # =========================================================

    match = re.search(
        r'\bname\s*:?\s*(.*?)(?=\s*(?:=|father\s+name\b|gender\b|country\b|identity\s+number\b|date\s+of\s+birth\b))',
        normalized_text,
        re.IGNORECASE
    )

    if match:

        candidate = match.group(1).strip()

        print("👉 NAME LABEL FOUND")
        print("👉 RAW NAME CANDIDATE:", repr(candidate))

        candidate = re.sub(
            r'\s*[=|~`]+\s*$',
            '',
            candidate
        ).strip()

        print("👉 CLEANED CNIC NAME:", repr(candidate))

        if is_valid_name_candidate(candidate):

            print(
                "✅ EXTRACTED CNIC NAME:",
                repr(candidate)
            )

            return candidate

    # =========================================================
    # CASE 2:
    # OCR gives:
    #
    # Name
    # Abdul Khaliq Sheikh
    # =========================================================

    for index, line in enumerate(lines):

        normalized_line = line.lower().strip()

        print(
            "CHECKING LINE:",
            index,
            repr(line),
            "NORMALIZED:",
            repr(normalized_line)
        )

        if normalized_line in [
            "name",
            "name:",
            "full name",
            "full name:",
        ]:

            print(
                "👉 NAME LABEL FOUND:",
                repr(line)
            )

            if index + 1 < len(lines):

                candidate = lines[index + 1].strip()

                print(
                    "👉 CANDIDATE AFTER NAME:",
                    repr(candidate)
                )

                if is_valid_name_candidate(candidate):

                    print(
                        "✅ NAME CANDIDATE ACCEPTED:",
                        repr(candidate)
                    )

                    return candidate

    # =========================================================
    # CASE 3:
    #
    # OCR failed to detect "Name:"
    #
    # Example:
    # stan national identity card islamic republic of pakistan
    # “abdul khaliq sheikh
    #
    # =========================================================

    fallback_match = re.search(
        r'(?:pakistan|pakis[t]?an)\s+[“"\'`‘’]?\s*([a-z]+(?:\s+[a-z]+){1,3})\s*$',
        normalized_text,
        re.IGNORECASE
    )

    if fallback_match:

        candidate = fallback_match.group(1).strip()

        print(
            "👉 FALLBACK NAME FOUND:",
            repr(candidate)
        )

        if is_valid_name_candidate(candidate):

            print(
                "✅ FALLBACK CNIC NAME ACCEPTED:",
                repr(candidate)
            )

            return candidate

    print("❌ NO CNIC NAME FOUND")

    return ""





def is_valid_name_candidate(value: str) -> bool:
    """
    Make sure the extracted value looks like a person's name
    and not another CNIC field.
    """

    if not value:
        return False

    value_lower = value.lower().strip()

    invalid_keywords = [
        "father",
        "date",
        "birth",
        "issue",
        "expiry",
        "identity",
        "card",
        "cnic",
        "pakistan",
        "gender",
        "address",
        "signature",
    ]

    if any(keyword in value_lower for keyword in invalid_keywords):
        return False

    # Remove common OCR noise
    cleaned = re.sub(r"[^A-Za-z\s]", "", value).strip()

    if not cleaned:
        return False

    # Name should contain at least two words
    words = cleaned.split()

    if len(words) < 2:
        return False

    return True

# def normalize_name(name: str) -> str:
#     """
#     Normalize a name before similarity comparison.
#     """

#     name = name.lower().strip()

#     # Remove punctuation
#     name = re.sub(r"[^a-z\s]", " ", name)

#     # Remove extra spaces
#     name = re.sub(r"\s+", " ", name)

#     return name.strip()

def normalize_name(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r"[^a-z\s]", " ", name)
    name = re.sub(r"\s+", " ", name)
    return name.strip()