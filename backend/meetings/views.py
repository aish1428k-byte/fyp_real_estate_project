from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Meeting
from .serializers import MeetingSerializer,MeetingDetailSerializer
from common.permissions import IsAgent


class MeetingCreateView(APIView):
    permission_classes = [IsAgent]


    def post(self, request):
        serializer = MeetingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Meeting created successfully",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Meeting Detail API
# class MeetingDetailView(APIView):
#     def get(self, request, pk):
#         try:
#             meeting = Meeting.objects.get(id=pk)
#         except Meeting.DoesNotExist:
#             return Response({"error": "Meeting Details not found"}, status=status.HTTP_404_NOT_FOUND)
#         serializer = MeetingDetailSerializer(meeting)
#         return Response(serializer.data, status=status.HTTP_200_OK)
class MeetingByTaskAPIView(APIView):
    def get(self, request, task_id):
        meetings = Meeting.objects.filter(task_id=task_id)

        serializer = MeetingDetailSerializer(
            meetings,
            many=True
        )
        return Response(serializer.data)