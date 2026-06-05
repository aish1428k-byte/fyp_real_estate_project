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

 # =====================================================
    # LOCAL IMPORTS (IMPORTANT: avoid startup crash)
    # =====================================================
    from common.blockchain_utils import BlockchainService
    from common.ipfs_utils import upload_to_ipfs, get_ipfs_gateway_url

    """
    Run the complete document upload pipeline for one file.

    Keyword Args:
        file                   – Django InMemoryUploadedFile from request.FILES
        property_id            – integer PK of the Property row
        expected_document_type – type the agent selected in the frontend
        user                   – request.user (authenticated agent)

    Returns a dict with these keys:
        success              bool
        status               "verified" | "rejected" | "pending"
        document_id          int or None
        document_type        str
        ipfs_hash            str
        ipfs_gateway_url     str
        tx_hash              str
        on_chain_document_id int or None
        block_number         int or None
        rejection_reason     str
        ocr_result           dict
        message              str
    """

    # ── Resolve the Property row ──────────────────────────────────────────────
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

        # ── Step 3 & 4: Detect + compare ──────────────────────────────────────
        decision = analyze_document(ocr_text, expected_document_type)

        # Build a summary dict for storing in the DB's ocr_result JSON field
        ocr_result = {
            "detected_type":  decision["detected_type"],
            "expected_type":  decision["expected_type"],
            "score":          decision["score"],
            "min_score":      decision["min_score"],
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
            tx_hash=chain["tx_hash"],
            on_chain_document_id=chain.get("on_chain_document_id"),
            block_number=chain.get("block_number"),
            status="verified",
            ocr_result=ocr_result,
        )

        logger.info(
            "VERIFIED — doc_id=%s cid=%s tx=%s",
            doc.id, cid, chain["tx_hash"],
        )

        return {
            "success":              True,
            "status":               "verified",
            "document_id":          doc.id,
            "document_type":        detected_type,
            "ipfs_hash":            cid,
            "ipfs_gateway_url":     gateway_url,
            "tx_hash":              chain["tx_hash"],
            "on_chain_document_id": chain.get("on_chain_document_id"),
            "block_number":         chain.get("block_number"),
            "rejection_reason":     "",
            "ocr_result":           ocr_result,
            "message":              "Document verified and stored on blockchain.",
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