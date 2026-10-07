import logging
import os
import tempfile

from property.models import Property
from documents.models import PropertyDocument
from lease.models import Lease

from common.ocr_utils import extract_text_from_image
from common.ocr_decision import analyze_document
from common.lease_ocr import verify_lease_details

logger = logging.getLogger(__name__)


def process_lease_upload(
    *,
    file,
    property_id,
    located_at,
    landlord,
    tenant,
    beginning_on,
    ending_on,
    lease_amount,
    user,
):
    from common.ipfs_utils import (
        upload_to_ipfs,
        get_ipfs_gateway_url
    )

    from common.blockchain_utils import BlockchainService

    try:
        property_obj = Property.objects.get(id=property_id)

    except Property.DoesNotExist:
        return {
            "success": False,
            "status": "rejected",
            "message": "Property not found."
        }
    # CHECK IF LEASE ALREADY EXISTS
    existing_lease = Lease.objects.filter(
        property=property_obj
    ).exists()

    if existing_lease:
        return {
            "success": False,
            "status": "rejected",
            "message": "Lease already exists for this property."
        }
    temp_file_path = None

    try:

        # ==================================================
        # STEP 1
        # SAVE TEMP FILE
        # ==================================================

        temp_file_path = _save_to_temp(file)

        # ==================================================
        # STEP 2
        # OCR
        # ==================================================

        ocr_text = extract_text_from_image(temp_file_path)

        print("\n========== OCR EXTRACTED TEXT ==========")
        print(repr(ocr_text))
        print("========================================")

        if not ocr_text.strip():
            return {
                "success": False,
                "status": "rejected",
                "message": "No readable text found."
            }

        # ==================================================
        # STEP 3
        # DOCUMENT TYPE CHECK
        # ==================================================

        decision = analyze_document(
            ocr_text,
            "lease_sale"
        )

        if not decision["is_valid"]:

            return {
                "success": False,
                "status": "rejected",
                "message": decision["rejection_reason"],
                "ocr_result": decision
            }

        # ==================================================
        # STEP 4
        # LEASE FIELD VALIDATION
        # ==================================================

        lease_check = verify_lease_details(
            ocr_text=ocr_text,
            located_at=located_at,
            landlord=landlord,
            tenant=tenant,
            beginning_on=beginning_on,
            ending_on=ending_on,
            lease_amount=lease_amount,
        )

        if not lease_check["is_valid"]:

            return {
                "success": False,
                "status": "rejected",
                "message": "Lease validation failed.",
                "errors": lease_check["errors"]
            }

        # ==================================================
        # STEP 5
        # UPLOAD TO IPFS
        # ==================================================

        cid = upload_to_ipfs(temp_file_path)

        gateway_url = get_ipfs_gateway_url(cid)

        # ==================================================
        # STEP 6
        # BLOCKCHAIN
        # ==================================================

        bc = BlockchainService()

        chain = bc.store_document_hash(
            cid=cid,
            document_type="lease_sale",
            property_id=property_id,
        )

        # ==================================================
        # STEP 7
        # CREATE PROPERTY DOCUMENT
        # ==================================================

        document = PropertyDocument.objects.create(
            property=property_obj,
            uploaded_by=user,

            document_type="lease_sale",

            ipfs_hash=cid,
            ipfs_gateway_url=gateway_url,

            tx_hash=chain["tx_hash"],
            on_chain_document_id=chain.get(
                "on_chain_document_id"
            ),
            block_number=chain.get(
                "block_number"
            ),

            status="verified",

            ocr_result={
                "detected_type": "lease_sale",
                "lease_validation": lease_check,
            }
        )

        # ==================================================
        # STEP 8
        # CREATE LEASE
        # ==================================================

        lease = Lease.objects.create(
            property=property_obj,
            document=document,

            located_at=located_at,

            landlord=landlord,
            tenant=tenant,

            beginning_on=beginning_on,
            ending_on=ending_on,

            lease_amount=lease_amount,

            created_by=user,
        )

        # ==================================================
        # STEP 9
        # SUCCESS
        # ==================================================

        return {
            "success": True,
            "status": "verified",

            "lease_id": lease.id,

            "document_id": document.id,

            "ipfs_hash": cid,

            "tx_hash": chain["tx_hash"],

            "message":
                "Lease verified, uploaded to IPFS and saved."
        }

    except Exception as exc:

        logger.exception(exc)

        return {
            "success": False,
            "status": "rejected",
            "message": str(exc)
        }

    finally:

        if temp_file_path and os.path.exists(
            temp_file_path
        ):
            try:
                os.remove(temp_file_path)
            except:
                pass


def _save_to_temp(file):

    suffix = os.path.splitext(file.name)[-1]

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as tmp:

        for chunk in file.chunks():
            tmp.write(chunk)

        return tmp.name