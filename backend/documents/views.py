# # documents/views.py
# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response

# from common.ocr_utils import extract_text_from_image
# from common.ocr_decision import analyze_document
# from common.ipfs_utils import upload_to_ipfs

# class UploadPropertyDocument(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         file = request.FILES.get("file")
#         property_id = request.data.get("property_id")

#         if not file:
#             return Response({"error": "File required"}, status=400)

#         # 1️⃣ temp save
#         path = save_temp_file(file)

#         # 2️⃣ OCR
#         text = extract_text_from_image(path)

#         # 3️⃣ decision
#         decision = analyze_document(text)

#         if not decision["is_valid_document"]:
#             return Response({
#                 "error": "Invalid document",
#                 "details": decision
#             }, status=400)

#         # 4️⃣ IPFS
#         cid = upload_to_ipfs(path)

#         # 5️⃣ DB
#         doc = PropertyDocument.objects.create(
#             property_id=property_id,
#             uploaded_by=request.user,
#             document_type=decision["document_type"],
#             ipfs_hash=cid,
#             status="verified"
#         )

#         return Response({
#             "message": "Document uploaded & verified",
#             "ipfs_hash": cid
#         })

# #___________________________ module 2 stratted
# import tempfile
# import os

# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response

# from .models import PropertyDocument
# from property.models import Property

# from common.ocr_utils import extract_text_from_image
# from common.ocr_decision import analyze_document
# from common.ipfs_utils import upload_to_ipfs


# class UploadPropertyDocument(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         file = request.FILES.get("file")
#         property_id = request.data.get("property_id")

#         if not file:
#             return Response({"error": "File required"}, status=400)

#         if not property_id:
#             return Response({"error": "property_id required"}, status=400)

#         try:
#             property_obj = Property.objects.get(id=property_id)
#         except Property.DoesNotExist:
#             return Response({"error": "Property not found"}, status=404)

#         temp_file_path = None

#         try:
#             # 1️⃣ TEMP SAVE (NO save_temp_file now)
#             with tempfile.NamedTemporaryFile(delete=False) as temp_file:
#                 for chunk in file.chunks():
#                     temp_file.write(chunk)
#                 temp_file_path = temp_file.name

#             # 2️⃣ OCR
#             text = extract_text_from_image(temp_file_path)

#             # 3️⃣ DECISION
#             decision = analyze_document(text)
#             if not decision["is_valid_document"]:
#                 return Response({
#                     "error": "Invalid document",
#                     "details": decision
#                 }, status=400)

#             # 4️⃣ IPFS
#             cid = upload_to_ipfs(temp_file_path)

#             # 5️⃣ DB SAVE
#             PropertyDocument.objects.create(
#                 property=property_obj,
#                 uploaded_by=request.user,
#                 document_type=decision.get("document_type", "unknown"),
#                 ipfs_hash=cid,
#                 status="verified"
#             )

#             return Response({
#                 "message": "Document uploaded & verified",
#                 "ipfs_hash": cid
#             })

#         finally:
#             if temp_file_path and os.path.exists(temp_file_path):
#                 os.remove(temp_file_path)

#  module 2 ended_________________
# documents/views.py

import logging

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PropertyDocument
from .serializers import PropertyDocumentSerializer
from documents.services import process_document_upload

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/tiff",
    "image/webp",
}
MAX_FILE_SIZE_MB   = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


class UploadPropertyDocumentView(APIView):
    

    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        # ── Input validation ──────────────────────────────────────────────────
        file          = request.FILES.get("file")
        property_id   = request.data.get("property_id")
        document_type = request.data.get("document_type", "").strip()

        if not file:
            return Response(
                {"error": "A file is required.", "status": "upload_failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not property_id:
            return Response(
                {"error": "property_id is required.", "status": "upload_failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not document_type:
            return Response(
                {"error": "document_type is required.", "status": "upload_failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # ADD THIS
        if document_type == "lease_sale":
            return Response(
                {
                    "error": "Lease documents cannot be uploaded by agents.",
                    "status": "upload_failed",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── File type check ───────────────────────────────────────────────────
        content_type = getattr(file, "content_type", "")
        if content_type not in ALLOWED_MIME_TYPES:
            return Response(
                {
                    "error": f"Unsupported file type '{content_type}'. "
                             f"Allowed: JPEG, PNG, TIFF, WEBP.",
                    "status": "upload_failed",
                },
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            )

        # ── File size check ───────────────────────────────────────────────────
        if file.size > MAX_FILE_SIZE_BYTES:
            return Response(
                {
                    "error": f"File exceeds {MAX_FILE_SIZE_MB} MB limit.",
                    "status": "upload_failed",
                },
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        # ── Convert property_id to int ────────────────────────────────────────
        try:
            property_id = int(property_id)
        except (TypeError, ValueError):
            return Response(
                {"error": "property_id must be an integer.", "status": "upload_failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Run pipeline ──────────────────────────────────────────────────────
        result = process_document_upload(
            file=file,
            property_id=property_id,
            expected_document_type=document_type,
            user=request.user,
        )

        http_status = (
            status.HTTP_201_CREATED
            if result["status"] == "verified"
            else status.HTTP_200_OK
        )

        return Response(result, status=http_status)


class PropertyDocumentListView(APIView):
    """
    GET /documents/?property=<id>

    Returns all documents for a given property.
    Optionally filter by ?status=verified|rejected|pending
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        property_id = request.query_params.get("property")
        doc_status  = request.query_params.get("status")

        qs = PropertyDocument.objects.select_related("property", "uploaded_by")

        if property_id:
            qs = qs.filter(property_id=property_id)

        if doc_status:
            qs = qs.filter(status=doc_status)

        serializer = PropertyDocumentSerializer(qs, many=True)
        return Response(serializer.data)


class PropertyDocumentDetailView(APIView):
    """
    GET /documents/<pk>/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc = PropertyDocument.objects.select_related(
                "property", "uploaded_by"
            ).get(pk=pk)
        except PropertyDocument.DoesNotExist:
            return Response(
                {"error": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PropertyDocumentSerializer(doc)
        return Response(serializer.data)
