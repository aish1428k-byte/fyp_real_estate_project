import tempfile
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .models import Agent
from .serializers import AgentSerializer,AgentViewSerializer,AgentUpdateSerializer,AgentViewStatusSerializer,AgentSelectSerializer,DocumentUploadSerializer
#from property.models import PropertyDocument
from documents.models import PropertyDocument

from common.permissions import IsManager
from common.ipfs_utils import upload_to_ipfs
from common.ocr_utils import extract_text_from_image
from common.ocr_decision import analyze_document


class AgentCreateView(APIView):
    permission_classes = [IsManager]

    def post(self, request):
        serializer = AgentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Agent created successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# for drop down


class AgentListView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        agents = Agent.objects.filter(status=True)
        serializer = AgentSelectSerializer(agents, many=True)
        return Response(serializer.data)



class AgentDetailView(APIView):
    permission_classes = [AllowAny]
    

    def get(self, request, id):
        try:
            agent = Agent.objects.get(id=id)
        except Agent.DoesNotExist:
            return Response(
                {"error": "Agent not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgentViewSerializer(agent)
        return Response(serializer.data, status=status.HTTP_200_OK)



class AgentStatusView(APIView):
    permission_classes = [AllowAny]

#    permission_classes = [IsManager]

    def get(self, request, id):
        try:
            agent = Agent.objects.get(id=id)
        except Agent.DoesNotExist:
            return Response(
                {"error": "Agent not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgentViewStatusSerializer(agent)
        return Response(serializer.data, status=status.HTTP_200_OK)




class AgentUpdateView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, id):
        try:
            agent = Agent.objects.get(id=id)
        except Agent.DoesNotExist:
            return Response(
                {"error": "Agent not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgentUpdateSerializer(agent, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                AgentViewSerializer(agent).data,
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id):
        try:
            agent = Agent.objects.get(id=id)
        except Agent.DoesNotExist:
            return Response(
                {"error": "Agent not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgentUpdateSerializer(
            agent, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                AgentViewSerializer(agent).data,
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        
class AgentDeleteView(APIView):
    permission_classes = [AllowAny]  
    
    def delete(self, request, id):
        try:
            agent = Agent.objects.get(id=id)
        except Agent.DoesNotExist:
            return Response(
                {"error": "Agent not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        agent.delete()
        return Response(
            {"message": "Agent deleted successfully"},
            status=status.HTTP_200_OK
        )


class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = serializer.validated_data['document']
        property_id = serializer.validated_data.get('property_id')

        # Get original file extension
        file_extension = os.path.splitext(uploaded_file.name)[1] or '.tmp'

        # Step 1: Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            for chunk in uploaded_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        try:
            # Step 2: Run OCR on the file
            ocr_text = extract_text_from_image(temp_file_path)

            # Step 3: Auto-detect document type and validate
            ocr_result = analyze_document(ocr_text)

            if not ocr_result.get('is_valid_document', False):
                return Response(
                    {"error": "Invalid document"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Step 4: Upload file to IPFS
            ipfs_cid = upload_to_ipfs(temp_file_path)

            # Step 5: Save to database
            document = PropertyDocument.objects.create(
                property_id=property_id,
                document_type=ocr_result['document_type'],
                ipfs_cid=ipfs_cid,
                ocr_result=ocr_result
            )

            # Step 6: Return response
            response_data = {
                "document_id": document.id,
                "cid": ipfs_cid,
                "document_type": ocr_result['document_type'],
                "is_valid_document": ocr_result['is_valid_document'],
                "ocr_result": ocr_result
            }
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Processing failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
