from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import ManagerProfile
from .serializers import (
    ManagerSerializer,
    ManagerViewSerializer,
    ManagerUpdateSerializer
)



class ManagerCreateView(APIView):
    permission_classes = [AllowAny]
    #permission_classes = [IsAdminUserType]

    def post(self, request):
        serializer = ManagerSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Manager created successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManagerDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id):
        try:
            manager = ManagerProfile.objects.get(id=id)
        except ManagerProfile.DoesNotExist:
            return Response(
                {"error": "Manager not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ManagerViewSerializer(manager)
        return Response(serializer.data, status=status.HTTP_200_OK)



class ManagerUpdateView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, id):
        try:
            manager = ManagerProfile.objects.get(id=id)
        except ManagerProfile.DoesNotExist:
            return Response(
                {"error": "Manager not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ManagerUpdateSerializer(manager, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                ManagerViewSerializer(manager).data,
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id):
        try:
            manager = ManagerProfile.objects.get(id=id)
        except ManagerProfile.DoesNotExist:
            return Response(
                {"error": "Manager not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ManagerUpdateSerializer(
            manager, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                ManagerViewSerializer(manager).data,
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManagerDeleteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, id):
        try:
            manager = ManagerProfile.objects.get(id=id)
        except ManagerProfile.DoesNotExist:
            return Response(
                {"error": "Manager not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        manager.delete()
        return Response(
            {"message": "Manager deleted successfully"},
            status=status.HTTP_200_OK
        )
